package client

import (
	"runtime"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestGetVersion(t *testing.T) {
	t.Run("returns version struct with expected fields", func(t *testing.T) {
		v := GetVersion()

		// Check that all fields are populated (even if with default values)
		assert.NotEmpty(t, v.Version)
		assert.NotEmpty(t, v.GitCommit)
		assert.NotEmpty(t, v.GitTreeState)
		assert.NotEmpty(t, v.BuildDate)
		assert.NotEmpty(t, v.BuiltBy)
		assert.NotEmpty(t, v.GoVersion)
		assert.NotEmpty(t, v.Platform)

		// Check that runtime fields are correctly populated
		assert.Equal(t, runtime.Version(), v.GoVersion)
		expectedPlatform := runtime.GOOS + "/" + runtime.GOARCH
		assert.Equal(t, expectedPlatform, v.Platform)
	})
}

func TestVersionString(t *testing.T) {
	testCases := []struct {
		name       string
		version    Version
		expectsDev bool
		contains   []string
	}{
		{
			name: "development version",
			version: Version{
				Version:   "dev",
				GitCommit: "abc123",
				BuildDate: "2023-01-01",
				BuiltBy:   "test",
			},
			expectsDev: true,
			contains:   []string{"admiral-client", "dev", "abc123", "2023-01-01", "test"},
		},
		{
			name: "release version",
			version: Version{
				Version:   "v1.2.3",
				GitCommit: "def456",
				BuildDate: "2023-01-02",
				BuiltBy:   "goreleaser",
			},
			expectsDev: false,
			contains:   []string{"admiral-client", "v1.2.3", "def456", "2023-01-02", "goreleaser"},
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			result := tc.version.String()

			// Verify all expected substrings are present
			for _, expected := range tc.contains {
				assert.Contains(t, result, expected, "result should contain %q", expected)
			}

			// Verify dev vs release format
			if tc.expectsDev {
				assert.Contains(t, result, "admiral-client dev")
			} else {
				assert.Contains(t, result, "admiral-client "+tc.version.Version)
			}
		})
	}
}

func TestVersionUserAgent(t *testing.T) {
	t.Run("generates valid user agent string", func(t *testing.T) {
		v := Version{
			Version:   "v1.0.0",
			GitCommit: "abc123def",
			BuildDate: "2023-01-01",
			BuiltBy:   "test",
			GoVersion: "go1.21.0",
			Platform:  "linux/amd64",
		}

		ua := v.UserAgent()

		// User agent should follow format: admiral-client/version (platform; go_version) commit
		expectedParts := []string{
			"admiral-client/v1.0.0",
			"(linux/amd64; go1.21.0)",
			"abc123def",
		}

		for _, part := range expectedParts {
			assert.Contains(t, ua, part, "user agent should contain %q", part)
		}

		// Should not contain newlines or other problematic characters
		assert.NotContains(t, ua, "\n")
		assert.NotContains(t, ua, "\r")
		assert.NotContains(t, ua, "\t")
	})

	t.Run("handles dev version", func(t *testing.T) {
		v := Version{
			Version:   "dev",
			GitCommit: "local-build",
			Platform:  "darwin/arm64",
			GoVersion: runtime.Version(),
		}

		ua := v.UserAgent()
		assert.Contains(t, ua, "admiral-client/dev")
		assert.Contains(t, ua, "darwin/arm64")
		assert.Contains(t, ua, "local-build")
	})
}

func TestClientVersion(t *testing.T) {
	t.Run("returns non-empty version string", func(t *testing.T) {
		version := ClientVersion()
		assert.NotEmpty(t, version)
		assert.Contains(t, version, "admiral-client")
	})
}

func TestClientUserAgent(t *testing.T) {
	t.Run("returns valid user agent", func(t *testing.T) {
		ua := ClientUserAgent()
		assert.NotEmpty(t, ua)
		assert.Contains(t, ua, "admiral-client")

		// Should follow User-Agent format conventions
		assert.True(t, strings.HasPrefix(ua, "admiral-client/"))
	})
}

func TestVersionInjection(t *testing.T) {
	t.Run("version variables have expected default values", func(t *testing.T) {
		// These should be the compile-time defaults when not injected by ldflags
		assert.Equal(t, "", version)
		assert.Equal(t, "", commit)
		assert.Equal(t, "", treeState)
		assert.Equal(t, "", date)
		assert.Equal(t, "", builtBy)
	})

	t.Run("GetVersion uses injected values", func(t *testing.T) {
		v := GetVersion()

		// In development/test, these should be the fallback defaults since injected values are empty
		assert.Equal(t, "dev", v.Version)
		assert.Equal(t, "unknown", v.GitCommit)
		assert.Equal(t, "clean", v.GitTreeState)
		assert.Equal(t, "unknown", v.BuildDate)
		assert.Equal(t, "unknown", v.BuiltBy)
	})
}

func TestVersionConsistency(t *testing.T) {
	t.Run("ClientVersion and GetVersion().String() are consistent", func(t *testing.T) {
		clientVersion := ClientVersion()
		getVersionString := GetVersion().String()

		assert.Equal(t, getVersionString, clientVersion)
	})

	t.Run("ClientUserAgent and GetVersion().UserAgent() are consistent", func(t *testing.T) {
		clientUA := ClientUserAgent()
		getVersionUA := GetVersion().UserAgent()

		assert.Equal(t, getVersionUA, clientUA)
	})
}

// TestVersionInBinary tests that version info would be properly injected in a real build
func TestVersionInBinary(t *testing.T) {
	t.Run("version information is accessible", func(t *testing.T) {
		v := GetVersion()

		// These tests ensure the version system works regardless of injection
		require.NotNil(t, v)
		assert.NotEmpty(t, v.Version)
		assert.NotEmpty(t, v.GitCommit)
		assert.NotEmpty(t, v.GitTreeState)
		assert.NotEmpty(t, v.BuildDate)
		assert.NotEmpty(t, v.BuiltBy)
		assert.NotEmpty(t, v.GoVersion)
		assert.NotEmpty(t, v.Platform)

		// Verify format of derived fields
		assert.True(t, strings.HasPrefix(v.GoVersion, "go"))
		assert.Contains(t, v.Platform, "/") // Should be OS/ARCH format
	})
}

func TestVersionTreeState(t *testing.T) {
	testCases := []struct {
		name           string
		version        Version
		expectInString []string
		expectInUA     []string
	}{
		{
			name: "clean tree state",
			version: Version{
				Version:      "v1.0.0",
				GitCommit:    "abc123",
				GitTreeState: "clean",
				BuildDate:    "2023-01-01",
				BuiltBy:      "test",
				GoVersion:    "go1.21.0",
				Platform:     "linux/amd64",
			},
			expectInString: []string{"admiral-client v1.0.0 (abc123) built"},
			expectInUA:     []string{"admiral-client/v1.0.0", "abc123"},
		},
		{
			name: "dirty tree state",
			version: Version{
				Version:      "v1.0.0",
				GitCommit:    "abc123",
				GitTreeState: "dirty",
				BuildDate:    "2023-01-01",
				BuiltBy:      "test",
				GoVersion:    "go1.21.0",
				Platform:     "linux/amd64",
			},
			expectInString: []string{"admiral-client v1.0.0 (abc123-dirty) built"},
			expectInUA:     []string{"admiral-client/v1.0.0", "abc123-dirty"},
		},
		{
			name: "empty tree state (treated as clean)",
			version: Version{
				Version:      "dev",
				GitCommit:    "local",
				GitTreeState: "",
				BuildDate:    "2023-01-01",
				BuiltBy:      "dev",
				GoVersion:    "go1.21.0",
				Platform:     "darwin/arm64",
			},
			expectInString: []string{"admiral-client dev (local) built"},
			expectInUA:     []string{"admiral-client/dev", "local"},
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			versionString := tc.version.String()
			userAgent := tc.version.UserAgent()

			for _, expected := range tc.expectInString {
				assert.Contains(t, versionString, expected)
			}

			for _, expected := range tc.expectInUA {
				assert.Contains(t, userAgent, expected)
			}
		})
	}
}
