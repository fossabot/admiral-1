package model

import (
	"time"

	"github.com/google/uuid"
	"google.golang.org/protobuf/types/known/timestamppb"
	"gorm.io/gorm"

	userv1 "go.admiral.io/admiral/api/user/v1"
)

type User struct {
	Id              uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	ProviderSubject string
	Email           string
	EmailVerified   bool
	Name            string
	GivenName       string
	FamilyName      string
	PictureUrl      string
	CreatedAt       time.Time
	UpdatedAt       time.Time
	DeletedAt       gorm.DeletedAt `gorm:"index"`
}

func ConvertUserToProto(u *User) *userv1.User {
	return &userv1.User{
		Id:            u.Id.String(),
		Email:         u.Email,
		EmailVerified: u.EmailVerified,
		Name:          u.Name,
		GivenName:     u.GivenName,
		FamilyName:    u.FamilyName,
		PictureUrl:    u.PictureUrl,
		CreatedAt:     timestamppb.New(u.CreatedAt),
		UpdatedAt:     timestamppb.New(u.UpdatedAt),
	}
}
