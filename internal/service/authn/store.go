package authn

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"golang.org/x/oauth2"
	"gorm.io/gorm"

	"go.admiral.io/admiral/internal/config"
	"go.admiral.io/admiral/internal/model"
)

type store struct {
	crypto            *cryptographer
	database          *gorm.DB
	createUserOnLogin bool
	updateUserOnLogin bool
}

func newStore(cfg *config.Config, db *gorm.DB) (*store, error) {
	//if cfg == nil {
	//	return nil, status.Error(codes.InvalidArgument, "configuration is nil")
	//}
	//if database == nil {
	//	return nil, status.Error(codes.InvalidArgument, "database connection is nil")
	//}

	crypto, err := newCryptographer("cfg.EncryptionPassphrase")
	if err != nil {
		return nil, err
	}

	return &store{
		database:          db,
		crypto:            crypto,
		createUserOnLogin: true,
		updateUserOnLogin: false,
	}, nil
}

func (s *store) syncUserByPrincipal(ctx context.Context, claims *Claims) (*model.User, error) {
	if claims == nil || claims.Subject == "" {
		return nil, errors.New("invalid claims: nil, or missing subject")
	}

	var user model.User
	result := s.database.WithContext(ctx).Where("deleted_at IS NULL").First(&user, "provider_subject = ?", claims.Subject)
	if result.Error != nil {
		if !errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, fmt.Errorf("failed to retrieve user for subject %s: %v", claims.Subject, result.Error)
		}

		if !s.createUserOnLogin {
			return nil, errors.New("user not found and creation disabled")
		}

		user = model.User{
			ProviderSubject: claims.Subject,
			Email:           claims.Email,
			EmailVerified:   claims.EmailVerified,
			Name:            claims.Name,
			GivenName:       claims.GivenName,
			FamilyName:      claims.FamilyName,
			PictureUrl:      claims.Picture,
		}
		if err := s.database.WithContext(ctx).Create(&user).Error; err != nil {
			return nil, fmt.Errorf("failed to create user for subject %s: %v", claims.Subject, err)
		}
		return &user, nil
	}

	if s.updateUserOnLogin {
		user.Email = claims.Email
		user.EmailVerified = claims.EmailVerified
		user.Name = claims.Name
		user.GivenName = claims.GivenName
		user.FamilyName = claims.FamilyName
		user.PictureUrl = claims.Picture

		if err := s.database.WithContext(ctx).Save(&user).Error; err != nil {
			return nil, fmt.Errorf("failed to update user for subject %s: %v", claims.Subject, err)
		}
	}

	return &user, nil
}

func (s *store) StoreToken(ctx context.Context, id string, parentID *string, provider string, referenceKind model.ReferenceKind, referenceId uuid.UUID, token *oauth2.Token) (*model.AuthnToken, error) {
	if id == "" {
		return nil, errors.New("id cannot be empty")
	}
	if token == nil {
		return nil, errors.New("token provided for storage was nil")
	}
	if token.AccessToken == "" {
		return nil, errors.New("access token cannot be empty")
	}
	if token.Expiry.IsZero() || token.Expiry.Before(time.Now()) {
		return nil, errors.New("token expiry is invalid")
	}

	authnToken := &model.AuthnToken{
		Id:            id,
		ParentID:      parentID,
		Provider:      provider,
		ReferenceKind: referenceKind,
		ReferenceId:   referenceId,
		AccessToken:   []byte(token.AccessToken),
		ExpiresAt:     token.Expiry,
	}

	if token.RefreshToken != "" {
		authnToken.RefreshToken = []byte(token.RefreshToken)
	}

	if it, ok := token.Extra("id_token").(string); ok {
		authnToken.IdToken = []byte(it)
	}

	err := s.database.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var existing model.AuthnToken
		err := tx.Where("id = ?", id).First(&existing).Error
		if err == nil {
			updates := map[string]interface{}{
				"provider":       authnToken.Provider,
				"reference_kind": authnToken.ReferenceKind,
				"reference_id":   authnToken.ReferenceId,
				"access_token":   authnToken.AccessToken,
				"refresh_token":  authnToken.RefreshToken,
				"id_token":       authnToken.IdToken,
				"expires_at":     authnToken.ExpiresAt,
			}
			if authnToken.ParentID != nil {
				updates["parent_id"] = authnToken.ParentID
			}
			return tx.Model(&existing).Updates(updates).Error
		}
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			return fmt.Errorf("failed to check existing token: %w", err)
		}
		return tx.Create(authnToken).Error
	})

	if err != nil {
		return nil, fmt.Errorf("failed to upsert authn token: %w", err)
	}

	return authnToken, nil
}

func (s *store) GetToken(ctx context.Context, id string) (*model.AuthnToken, *oauth2.Token, error) {
	if id == "" {
		return nil, nil, errors.New("id cannot be empty")
	}

	var authnToken model.AuthnToken
	err := s.database.WithContext(ctx).
		Where("id = ?", id).
		First(&authnToken).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil, errors.New("no active token found")
	}
	if err != nil {
		return nil, nil, fmt.Errorf("failed to retrieve authn token: %w", err)
	}

	oauth2Token := &oauth2.Token{
		AccessToken: string(authnToken.AccessToken),
		Expiry:      authnToken.ExpiresAt,
	}

	if len(authnToken.RefreshToken) > 0 {
		oauth2Token.RefreshToken = string(authnToken.RefreshToken)
	}

	if len(authnToken.IdToken) > 0 {
		oauth2Token = oauth2Token.WithExtra(map[string]interface{}{
			"id_token": string(authnToken.IdToken),
		})
	}

	return &authnToken, oauth2Token, nil
}
