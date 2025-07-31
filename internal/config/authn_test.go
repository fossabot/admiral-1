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
			expectedScopes: []string{"openid", "offline_access", "email", "profile"},
			expectedName:   "generic",
		},
		{
			name: "missing scopes uses defaults",
			yaml: `
name: cognito
issuer: http://cognito.example.com
`,
			expectedScopes: []string{"openid", "offline_access", "email", "profile"},
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
nonce_secret: nonce123
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
	assert.Equal(t, "nonce123", authn.NonceSecret)
	assert.True(t, authn.SkipTLSVerify)
	assert.Equal(t, []string{"openid", "profile"}, authn.Scopes)
}
