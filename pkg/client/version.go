package client

import (
	"fmt"
	"runtime"
)

// Version information that gets injected at build time via GoReleaser ldflags
//
//nolint:gochecknoglobals
var (
	// version is the client library version, injected at build time
	version = ""
	// commit is the git commit hash, injected at build time
	commit = ""
	// treeState is the git tree state, injected at build time
	treeState = ""
	// date is the build date, injected at build time
	date = ""
	// builtBy is who built the client, injected at build time
	builtBy = ""
)

// Version holds version information for the client library
type Version struct {
	Version      string `json:"version"`
	GitCommit    string `json:"git_commit"`
	GitTreeState string `json:"git_tree_state"`
	BuildDate    string `json:"build_date"`
	BuiltBy      string `json:"built_by"`
	GoVersion    string `json:"go_version"`
	Platform     string `json:"platform"`
}

// GetVersion returns the current version information for the client library
func GetVersion() Version {
	v := Version{
		GoVersion: runtime.Version(),
		Platform:  fmt.Sprintf("%s/%s", runtime.GOOS, runtime.GOARCH),
	}

	// Handle version injection similar to main.go
	if version != "" {
		v.Version = version
	} else {
		v.Version = "dev"
	}

	if commit != "" {
		v.GitCommit = commit
	} else {
		v.GitCommit = "unknown"
	}

	if treeState != "" {
		v.GitTreeState = treeState
	} else {
		v.GitTreeState = "clean"
	}

	if date != "" {
		v.BuildDate = date
	} else {
		v.BuildDate = "unknown"
	}

	if builtBy != "" {
		v.BuiltBy = builtBy
	} else {
		v.BuiltBy = "unknown"
	}

	return v
}

// String returns a formatted version string
func (v Version) String() string {
	commitInfo := v.GitCommit
	if v.GitTreeState != "" && v.GitTreeState != "clean" {
		commitInfo = fmt.Sprintf("%s-%s", v.GitCommit, v.GitTreeState)
	}

	if v.Version == "dev" {
		return fmt.Sprintf("admiral-client dev (%s) built on %s by %s",
			commitInfo, v.BuildDate, v.BuiltBy)
	}
	return fmt.Sprintf("admiral-client %s (%s) built on %s by %s",
		v.Version, commitInfo, v.BuildDate, v.BuiltBy)
}

// UserAgent returns a properly formatted User-Agent string for HTTP/gRPC requests
func (v Version) UserAgent() string {
	commitInfo := v.GitCommit
	if v.GitTreeState != "" && v.GitTreeState != "clean" {
		commitInfo = fmt.Sprintf("%s-%s", v.GitCommit, v.GitTreeState)
	}

	return fmt.Sprintf("admiral-client/%s (%s; %s) %s",
		v.Version, v.Platform, v.GoVersion, commitInfo)
}

// ClientVersion returns the current client version string
func ClientVersion() string {
	return GetVersion().String()
}

// ClientUserAgent returns a User-Agent string for the client
func ClientUserAgent() string {
	return GetVersion().UserAgent()
}
