package authn

import (
	"context"
	"fmt"
	"github.com/alexedwards/scs/v2"
	"net/http"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"google.golang.org/grpc/metadata"
)

type MockSessionService struct {
	accessToken string
	loadErr     error
}

func (m *MockSessionService) Load(ctx context.Context, token string) (context.Context, error) {
	if m.loadErr != nil {
		return nil, m.loadErr
	}

	type sessionKeyType struct{}
	var sessionKey sessionKeyType
	return context.WithValue(ctx, sessionKey, token), nil
}

func (m *MockSessionService) GetString(ctx context.Context, key string) string {
	if key == "accessToken" {
		return m.accessToken
	}
	return ""
}

func (m *MockSessionService) LoadAndSave(next http.Handler) http.Handler { return next }
func (m *MockSessionService) WriteSessionCookie(ctx context.Context, w http.ResponseWriter, token string, expiry time.Time) {
}
func (m *MockSessionService) Commit(ctx context.Context) (string, time.Time, error) {
	return "", time.Time{}, nil
}
func (m *MockSessionService) Destroy(ctx context.Context) error                    { return nil }
func (m *MockSessionService) Put(ctx context.Context, key string, val interface{}) {}
func (m *MockSessionService) Get(ctx context.Context, key string) interface{}      { return nil }
func (m *MockSessionService) Pop(ctx context.Context, key string) interface{}      { return nil }
func (m *MockSessionService) Remove(ctx context.Context, key string)               {}
func (m *MockSessionService) Clear(ctx context.Context) error                      { return nil }
func (m *MockSessionService) Exists(ctx context.Context, key string) bool          { return false }
func (m *MockSessionService) Keys(ctx context.Context) []string                    { return nil }
func (m *MockSessionService) RenewToken(ctx context.Context) error                 { return nil }
func (m *MockSessionService) MergeSession(ctx context.Context, token string) error { return nil }
func (m *MockSessionService) Status(ctx context.Context) scs.Status {
	if ctx == nil {
		return scs.Destroyed

	}
	return scs.Unmodified
}
func (m *MockSessionService) GetBool(ctx context.Context, key string) bool      { return false }
func (m *MockSessionService) GetInt(ctx context.Context, key string) int        { return 0 }
func (m *MockSessionService) GetInt64(ctx context.Context, key string) int64    { return 0 }
func (m *MockSessionService) GetInt32(ctx context.Context, key string) int32    { return 0 }
func (m *MockSessionService) GetFloat(ctx context.Context, key string) float64  { return 0 }
func (m *MockSessionService) GetBytes(ctx context.Context, key string) []byte   { return nil }
func (m *MockSessionService) GetTime(ctx context.Context, key string) time.Time { return time.Time{} }
func (m *MockSessionService) PopString(ctx context.Context, key string) string  { return "" }
func (m *MockSessionService) PopBool(ctx context.Context, key string) bool      { return false }
func (m *MockSessionService) PopInt(ctx context.Context, key string) int        { return 0 }
func (m *MockSessionService) PopFloat(ctx context.Context, key string) float64  { return 0 }
func (m *MockSessionService) PopBytes(ctx context.Context, key string) []byte   { return nil }
func (m *MockSessionService) PopTime(ctx context.Context, key string) time.Time { return time.Time{} }
func (m *MockSessionService) RememberMe(ctx context.Context, val bool)          {}
func (m *MockSessionService) Iterate(ctx context.Context, fn func(context.Context) error) error {
	return nil
}
func (m *MockSessionService) Deadline(ctx context.Context) time.Time            { return time.Time{} }
func (m *MockSessionService) SetDeadline(ctx context.Context, expire time.Time) {}
func (m *MockSessionService) Token(ctx context.Context) string                  { return "" }

func TestGetToken(t *testing.T) {
	tokenVal := "quux"
	sessionID := "session123"
	ctx := context.Background()

	m := &mid{
		session: &MockSessionService{
			accessToken: tokenVal,
		},
	}

	tests := []struct {
		name        string
		md          metadata.MD
		ctx         context.Context
		sessionErr  error
		expected    string
		expectErr   bool
		errContains string
	}{
		{
			name:      "valid Authorization Bearer",
			md:        metadata.Pairs("authorization", "Bearer "+tokenVal),
			ctx:       ctx,
			expected:  tokenVal,
			expectErr: false,
		},
		{
			name:      "valid Authorization Bearer (case insensitive)",
			md:        metadata.Pairs("Authorization", "bearer "+tokenVal),
			ctx:       ctx,
			expected:  tokenVal,
			expectErr: false,
		},
		{
			name:      "valid session cookie",
			md:        metadata.Pairs("grpcgateway-cookie", "session="+sessionID),
			ctx:       ctx,
			expected:  tokenVal,
			expectErr: false,
		},
		{
			name:        "invalid Authorization format",
			md:          metadata.Pairs("authorization", "Token "+tokenVal),
			ctx:         ctx,
			expectErr:   true,
			errContains: "bad token format, expected Authorization: Bearer <token>",
		},
		{
			name:        "missing token in Authorization",
			md:          metadata.Pairs("authorization", "Bearer "),
			ctx:         ctx,
			expectErr:   true,
			errContains: "bad token format, expected Authorization: Bearer <token>",
		},
		{
			name:        "no headers",
			md:          metadata.Pairs(),
			ctx:         ctx,
			expectErr:   true,
			errContains: "token not present in authorization header or cookies",
		},
		{
			name:        "invalid cookie format",
			md:          metadata.Pairs("grpcgateway-cookie", "foo=bar"),
			ctx:         ctx,
			expectErr:   true,
			errContains: "failed to extract session cookie",
		},
		{
			name:        "session load failure",
			md:          metadata.Pairs("grpcgateway-cookie", "session="+sessionID),
			ctx:         ctx,
			sessionErr:  fmt.Errorf("session not found"),
			expectErr:   true,
			errContains: "session not found",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()

			m.session.(*MockSessionService).loadErr = tt.sessionErr
			result, err := m.getToken(tt.ctx, tt.md)
			if tt.expectErr {
				assert.Error(t, err)
				assert.Contains(t, err.Error(), tt.errContains)
			} else {
				assert.NoError(t, err)
				assert.Equal(t, tt.expected, result)
			}
		})
	}
}
