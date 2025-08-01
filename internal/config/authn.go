package config

import (
	"fmt"
	"strings"
)

type Authn struct {
	Name          string   `yaml:"name"`
	Issuer        string   `yaml:"issuer"`
	ClientID      string   `yaml:"client_id"`
	ClientSecret  string   `yaml:"client_secret"`
	Scopes        []string `yaml:"scopes"`
	RedirectURL   string   `yaml:"redirect_url"`
	SigningSecret string   `yaml:"signing_secret"`
	SkipTLSVerify bool     `yaml:"skip_tls_verify"`
}

func (a *Authn) UnmarshalYAML(unmarshal func(interface{}) error) error {
	type rawAuthn Authn
	raw := rawAuthn{
		Scopes: []string{"openid", "email", "profile"},
	}

	var temp map[string]interface{}
	if err := unmarshal(&temp); err != nil {
		return err
	}

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
	if v, ok := temp["signing_secret"]; ok {
		raw.SigningSecret = v.(string)
	}
	if v, ok := temp["skip_tls_verify"]; ok {
		raw.SkipTLSVerify = v.(bool)
	}

	// Handle scopes - can be string (comma-separated) or array
	if v, ok := temp["scopes"]; ok {
		switch scopes := v.(type) {
		case string:
			if scopes != "" {
				raw.Scopes = strings.Split(scopes, ",")
				for i, scope := range raw.Scopes {
					raw.Scopes[i] = strings.TrimSpace(scope)
				}
			}
		case []interface{}:
			raw.Scopes = make([]string, len(scopes))
			for i, scope := range scopes {
				raw.Scopes[i] = scope.(string)
			}
		}
	}

	*a = Authn(raw)
	return nil
}

func (a *Authn) SetDefaults() {
	if a == nil {
		return
	}
	if len(a.Scopes) == 0 {
		a.Scopes = []string{"openid", "email", "profile"}
	}
}

func (a *Authn) Validate() error {
	if a == nil {
		return nil
	}
	if a.Issuer == "" {
		return fmt.Errorf("issuer is required")
	}
	if a.ClientID == "" {
		return fmt.Errorf("client_id is required")
	}
	if a.ClientSecret == "" {
		return fmt.Errorf("client_secret is required")
	}
	if a.SigningSecret == "" {
		return fmt.Errorf("signing_secret is required")
	}

	return nil
}
