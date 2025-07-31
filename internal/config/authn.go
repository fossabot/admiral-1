package config

import (
	"strings"
)

type Authn struct {
	Name         string   `yaml:"name"`
	Issuer       string   `yaml:"issuer"`
	ClientID     string   `yaml:"client_id"`
	ClientSecret string   `yaml:"client_secret"`
	Scopes       []string `yaml:"scopes"`
	RedirectURL  string   `yaml:"redirect_url"`
	NonceSecret  string   `yaml:"nonce_secret"`

	SkipTLSVerify bool `yaml:"skip_tls_verify"`
}

// UnmarshalYAML implements custom unmarshaling to handle scopes as either array or comma-separated string
func (a *Authn) UnmarshalYAML(unmarshal func(interface{}) error) error {
	// First try to unmarshal as the normal struct
	type rawAuthn Authn
	raw := rawAuthn{
		// Set default scopes if none provided
		Scopes: []string{"openid", "offline_access", "email", "profile"},
	}

	// Try unmarshaling into a temporary map to handle scopes specially
	var temp map[string]interface{}
	if err := unmarshal(&temp); err != nil {
		return err
	}

	// Handle all other fields normally
	if v, ok := temp["name"]; ok {
		raw.Name = v.(string)
	}
	if v, ok := temp["issuer"]; ok {
		raw.Issuer = v.(string)
	}
	if v, ok := temp["client_id"]; ok {
		raw.ClientID = v.(string)
	}
	if v, ok := temp["client_secret"]; ok {
		raw.ClientSecret = v.(string)
	}
	if v, ok := temp["redirect_url"]; ok {
		raw.RedirectURL = v.(string)
	}
	if v, ok := temp["nonce_secret"]; ok {
		raw.NonceSecret = v.(string)
	}
	if v, ok := temp["skip_tls_verify"]; ok {
		raw.SkipTLSVerify = v.(bool)
	}

	// Handle scopes - can be string (comma-separated) or array
	if v, ok := temp["scopes"]; ok {
		switch scopes := v.(type) {
		case string:
			// Handle comma-separated string
			if scopes != "" {
				raw.Scopes = strings.Split(scopes, ",")
				// Trim whitespace from each scope
				for i, scope := range raw.Scopes {
					raw.Scopes[i] = strings.TrimSpace(scope)
				}
			}
		case []interface{}:
			// Handle array
			raw.Scopes = make([]string, len(scopes))
			for i, scope := range scopes {
				raw.Scopes[i] = scope.(string)
			}
		}
	}

	*a = Authn(raw)
	return nil
}
