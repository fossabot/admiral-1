package config

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
