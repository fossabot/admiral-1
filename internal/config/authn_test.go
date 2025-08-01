package config

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gopkg.in/yaml.v3"
)

func TestAuthn_UnmarshalYAML(t *testing.T) {
	tests := []struct {
		name           string
		yaml           string
		expectedScopes []string
		expectedName   string
	}{
		{
			name: "scopes as comma-separated string",
			yaml: `
name: keycloak
issuer: http://localhost:9090
client_id: test-client
scopes: openid,offline_access,email,profile
`,
			expectedScopes: []string{"openid", "offline_access", "email", "profile"},
			expectedName:   "keycloak",
		},
		{
			name: "scopes as comma-separated string with spaces",
			yaml: `
name: okta
scopes: openid, offline_access, email, profile
`,
			expectedScopes: []string{"openid", "offline_access", "email", "profile"},
			expectedName:   "okta",
		},
		{
			name: "scopes as yaml array",
			yaml: `
name: auth0
scopes:
  - openid
  - offline_access
  - email
  - profile
`,
			expectedScopes: []string{"openid", "offline_access", "email", "profile"},
			expectedName:   "auth0",
		},
		{
			name: "empty scopes string uses defaults",
			yaml: `
name: generic
scopes: ""
`,
			expectedScopes: []string{"openid", "email", "profile"},
			expectedName:   "generic",
		},
		{
			name: "missing scopes uses defaults",
			yaml: `
name: cognito
issuer: http://cognito.example.com
`,
			expectedScopes: []string{"openid", "email", "profile"},
			expectedName:   "cognito",
		},
		{
			name: "custom scopes as string",
			yaml: `
name: custom
scopes: read,write,admin
`,
			expectedScopes: []string{"read", "write", "admin"},
			expectedName:   "custom",
		},
		{
			name: "single scope as string",
			yaml: `
name: minimal
scopes: openid
`,
			expectedScopes: []string{"openid"},
			expectedName:   "minimal",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var authn Authn
			err := yaml.Unmarshal([]byte(tt.yaml), &authn)

			require.NoError(t, err)
			assert.Equal(t, tt.expectedScopes, authn.Scopes)
			assert.Equal(t, tt.expectedName, authn.Name)
		})
	}
}

func TestAuthn_UnmarshalYAML_AllFields(t *testing.T) {
	yamlData := `
name: keycloak
issuer: http://localhost:9090/realms/test
client_id: test-client
client_secret: secret123
redirect_url: http://localhost:8080/callback
signing_secret: signing123
skip_tls_verify: true
scopes: openid,profile
`

	var authn Authn
	err := yaml.Unmarshal([]byte(yamlData), &authn)

	require.NoError(t, err)
	assert.Equal(t, "keycloak", authn.Name)
	assert.Equal(t, "http://localhost:9090/realms/test", authn.Issuer)
	assert.Equal(t, "test-client", authn.ClientID)
	assert.Equal(t, "secret123", authn.ClientSecret)
	assert.Equal(t, "http://localhost:8080/callback", authn.RedirectURL)
	assert.Equal(t, "signing123", authn.SigningSecret)
	assert.True(t, authn.SkipTLSVerify)
	assert.Equal(t, []string{"openid", "profile"}, authn.Scopes)
}

func TestAuthn_SetDefaults(t *testing.T) {
	tests := []struct {
		name           string
		authn          Authn
		expectedScopes []string
	}{
		{
			name:           "empty scopes gets defaults",
			authn:          Authn{Scopes: []string{}},
			expectedScopes: []string{"openid", "email", "profile"},
		},
		{
			name:           "nil scopes gets defaults",
			authn:          Authn{Scopes: nil},
			expectedScopes: []string{"openid", "email", "profile"},
		},
		{
			name:           "existing scopes preserved",
			authn:          Authn{Scopes: []string{"read", "write"}},
			expectedScopes: []string{"read", "write"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			tt.authn.SetDefaults()
			assert.Equal(t, tt.expectedScopes, tt.authn.Scopes)
		})
	}
}

func TestAuthn_Validate(t *testing.T) {
	tests := []struct {
		name        string
		authn       Authn
		expectError bool
		errorMsg    string
	}{
		{
			name: "valid authn config",
			authn: Authn{
				Issuer:        "http://localhost:9090",
				ClientID:      "test-client",
				ClientSecret:  "secret123",
				SigningSecret: "signing123",
			},
			expectError: false,
		},
		{
			name: "missing issuer",
			authn: Authn{
				ClientID:      "test-client",
				ClientSecret:  "secret123",
				SigningSecret: "signing123",
			},
			expectError: true,
			errorMsg:    "issuer is required",
		},
		{
			name: "missing client_id",
			authn: Authn{
				Issuer:        "http://localhost:9090",
				ClientSecret:  "secret123",
				SigningSecret: "signing123",
			},
			expectError: true,
			errorMsg:    "client_id is required",
		},
		{
			name: "missing client_secret",
			authn: Authn{
				Issuer:        "http://localhost:9090",
				ClientID:      "test-client",
				SigningSecret: "signing123",
			},
			expectError: true,
			errorMsg:    "client_secret is required",
		},
		{
			name: "missing signing_secret",
			authn: Authn{
				Issuer:       "http://localhost:9090",
				ClientID:     "test-client",
				ClientSecret: "secret123",
			},
			expectError: true,
			errorMsg:    "signing_secret is required",
		},
		{
			name: "empty issuer",
			authn: Authn{
				Issuer:        "",
				ClientID:      "test-client",
				ClientSecret:  "secret123",
				SigningSecret: "signing123",
			},
			expectError: true,
			errorMsg:    "issuer is required",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := tt.authn.Validate()
			if tt.expectError {
				assert.Error(t, err)
				assert.Contains(t, err.Error(), tt.errorMsg)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

func TestAuthn_UnmarshalYAML_ErrorCases(t *testing.T) {
	tests := []struct {
		name    string
		yaml    string
		wantErr bool
	}{
		{
			name:    "invalid yaml structure",
			yaml:    "invalid: [unclosed",
			wantErr: true,
		},
		{
			name:    "scopes as invalid type (number)",
			yaml:    "scopes: 123",
			wantErr: false, // Should not error, just ignore invalid scopes
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var authn Authn
			err := yaml.Unmarshal([]byte(tt.yaml), &authn)
			if tt.wantErr {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

func TestAuthn_StructFields(t *testing.T) {
	t.Run("authn struct has all expected fields", func(t *testing.T) {
		authn := Authn{
			Name:          "test-provider",
			Issuer:        "http://localhost:9090",
			ClientID:      "test-client",
			ClientSecret:  "secret123",
			Scopes:        []string{"openid", "email"},
			RedirectURL:   "http://localhost:8080/callback",
			SigningSecret: "signing123",
			SkipTLSVerify: true,
		}

		assert.Equal(t, "test-provider", authn.Name)
		assert.Equal(t, "http://localhost:9090", authn.Issuer)
		assert.Equal(t, "test-client", authn.ClientID)
		assert.Equal(t, "secret123", authn.ClientSecret)
		assert.Equal(t, []string{"openid", "email"}, authn.Scopes)
		assert.Equal(t, "http://localhost:8080/callback", authn.RedirectURL)
		assert.Equal(t, "signing123", authn.SigningSecret)
		assert.True(t, authn.SkipTLSVerify)
	})
}
