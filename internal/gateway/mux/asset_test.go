package mux

import (
	"errors"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

// Mock FileSystem for testing
type mockFileSystem struct {
	files map[string]mockFile
}

type mockFile struct {
	content string
	err     error
}

func (mfs *mockFileSystem) Open(name string) (http.File, error) {
	if file, exists := mfs.files[name]; exists {
		if file.err != nil {
			return nil, file.err
		}
		return &mockHTTPFile{
			content: file.content,
			name:    name,
		}, nil
	}
	return nil, errors.New("file not found")
}

// Mock HTTP File implementation
type mockHTTPFile struct {
	content string
	name    string
	pos     int
	closed  bool
}

func (f *mockHTTPFile) Read(p []byte) (n int, err error) {
	if f.closed {
		return 0, errors.New("file closed")
	}
	if f.pos >= len(f.content) {
		return 0, errors.New("EOF")
	}
	n = copy(p, f.content[f.pos:])
	f.pos += n
	return n, nil
}

func (f *mockHTTPFile) Seek(offset int64, whence int) (int64, error) {
	if f.closed {
		return 0, errors.New("file closed")
	}
	switch whence {
	case 0: // absolute
		f.pos = int(offset)
	case 1: // relative to current
		f.pos += int(offset)
	case 2: // relative to end
		f.pos = len(f.content) + int(offset)
	}
	if f.pos < 0 {
		f.pos = 0
	}
	if f.pos > len(f.content) {
		f.pos = len(f.content)
	}
	return int64(f.pos), nil
}

func (f *mockHTTPFile) Close() error {
	f.closed = true
	return nil
}

func (f *mockHTTPFile) Readdir(count int) ([]os.FileInfo, error) {
	return nil, errors.New("not implemented")
}

func (f *mockHTTPFile) Stat() (os.FileInfo, error) {
	return &mockFileInfo{
		name: f.name,
		size: int64(len(f.content)),
	}, nil
}

// Mock FileInfo implementation
type mockFileInfo struct {
	name string
	size int64
}

func (fi *mockFileInfo) Name() string       { return fi.name }
func (fi *mockFileInfo) Size() int64        { return fi.size }
func (fi *mockFileInfo) Mode() os.FileMode  { return 0644 }
func (fi *mockFileInfo) ModTime() time.Time { return time.Now() }
func (fi *mockFileInfo) IsDir() bool        { return false }
func (fi *mockFileInfo) Sys() interface{}   { return nil }

// Mock next handler for testing
type mockNextHandler struct {
	called     bool
	statusCode int
	response   string
}

func (h *mockNextHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	h.called = true
	if h.statusCode > 0 {
		w.WriteHeader(h.statusCode)
	}
	if h.response != "" {
		w.Write([]byte(h.response))
	}
}

// Mock file server for testing
type mockFileServer struct {
	called     bool
	statusCode int
	response   string
}

func (h *mockFileServer) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	h.called = true
	if h.statusCode > 0 {
		w.WriteHeader(h.statusCode)
	}
	if h.response != "" {
		w.Write([]byte(h.response))
	}
}

func TestAssetHandler_ServeHTTP_StaticAssets(t *testing.T) {
	testCases := []struct {
		name              string
		path              string
		fileExists        bool
		expectServed      bool
		expectCacheHeader bool
	}{
		{
			name:              "favicon.ico at root",
			path:              "/favicon.ico",
			fileExists:        true,
			expectServed:      true,
			expectCacheHeader: true,
		},
		{
			name:              "logo.svg at root",
			path:              "/logo.svg",
			fileExists:        true,
			expectServed:      true,
			expectCacheHeader: true,
		},
		{
			name:              "image.webp at root",
			path:              "/image.webp",
			fileExists:        true,
			expectServed:      true,
			expectCacheHeader: true,
		},
		{
			name:              "icon.ico in subdirectory",
			path:              "/assets/icon.ico",
			fileExists:        true,
			expectServed:      false,
			expectCacheHeader: false,
		},
		{
			name:              "missing favicon.ico",
			path:              "/favicon.ico",
			fileExists:        false,
			expectServed:      false,
			expectCacheHeader: false,
		},
		{
			name:              "non-asset file with .ico extension",
			path:              "/not-an-asset.ico",
			fileExists:        false,
			expectServed:      false,
			expectCacheHeader: false,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			// Setup mock filesystem
			mockFS := &mockFileSystem{
				files: make(map[string]mockFile),
			}
			if tc.fileExists {
				mockFS.files[tc.path] = mockFile{
					content: "mock file content",
				}
			}

			// Setup handlers
			mockNext := &mockNextHandler{}
			mockFileServer := &mockFileServer{response: "file server response"}

			handler := &assetHandler{
				FileSystem: mockFS,
				FileServer: mockFileServer,
				Next:       mockNext,
			}

			// Create request and response recorder
			req := httptest.NewRequest("GET", tc.path, nil)
			w := httptest.NewRecorder()

			// Execute
			handler.ServeHTTP(w, req)

			// Assertions
			if tc.expectServed {
				assert.Equal(t, http.StatusOK, w.Code)
				if tc.expectCacheHeader {
					assert.Equal(t, "public, max-age=86400", w.Header().Get("Cache-Control"))
				}
				assert.False(t, mockNext.called, "Next handler should not be called for static assets")
				assert.False(t, mockFileServer.called, "File server should not be called for static assets")
			} else {
				assert.False(t, mockNext.called, "Next handler should not be called for non-API routes")
				assert.True(t, mockFileServer.called, "File server should be called for fallback")
			}
		})
	}
}

func TestAssetHandler_ServeHTTP_APIRoutes(t *testing.T) {
	testCases := []struct {
		name           string
		path           string
		expectNextCall bool
	}{
		{
			name:           "auth route",
			path:           "/auth/login",
			expectNextCall: true,
		},
		{
			name:           "auth root",
			path:           "/auth/",
			expectNextCall: true,
		},
		{
			name:           "api v1 route",
			path:           "/api/v1/users",
			expectNextCall: true,
		},
		{
			name:           "api v2 route",
			path:           "/api/v2/applications",
			expectNextCall: true,
		},
		{
			name:           "api v10 route",
			path:           "/api/v10/test",
			expectNextCall: true,
		},
		{
			name:           "healthcheck",
			path:           "/healthcheck",
			expectNextCall: true,
		},
		{
			name:           "non-api route",
			path:           "/dashboard",
			expectNextCall: false,
		},
		{
			name:           "root path",
			path:           "/",
			expectNextCall: false,
		},
		{
			name:           "static path",
			path:           "/static/js/app.js",
			expectNextCall: false,
		},
		{
			name:           "similar to api but not matching",
			path:           "/api/test",
			expectNextCall: false,
		},
		{
			name:           "similar to auth but not matching",
			path:           "/authenticate",
			expectNextCall: false,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			// Setup handlers
			mockNext := &mockNextHandler{response: "API response"}
			mockFileServer := &mockFileServer{response: "file server response"}
			mockFS := &mockFileSystem{files: make(map[string]mockFile)}

			handler := &assetHandler{
				FileSystem: mockFS,
				FileServer: mockFileServer,
				Next:       mockNext,
			}

			// Create request and response recorder
			req := httptest.NewRequest("GET", tc.path, nil)
			w := httptest.NewRecorder()

			// Execute
			handler.ServeHTTP(w, req)

			// Assertions
			if tc.expectNextCall {
				assert.True(t, mockNext.called, "Next handler should be called for API routes")
				assert.False(t, mockFileServer.called, "File server should not be called for API routes")
				assert.Equal(t, "API response", w.Body.String())
			} else {
				assert.False(t, mockNext.called, "Next handler should not be called for non-API routes")
				assert.True(t, mockFileServer.called, "File server should be called for non-API routes")
				assert.Equal(t, "file server response", w.Body.String())
			}
		})
	}
}

func TestAssetHandler_ServeHTTP_SPAFallback(t *testing.T) {
	testCases := []struct {
		name         string
		path         string
		fileExists   bool
		expectedPath string
		description  string
	}{
		{
			name:         "existing file served as-is",
			path:         "/assets/app.js",
			fileExists:   true,
			expectedPath: "/assets/app.js",
			description:  "Existing files should be served with their original path",
		},
		{
			name:         "non-existing file falls back to root",
			path:         "/dashboard",
			fileExists:   false,
			expectedPath: "/",
			description:  "Non-existing files should fall back to root for SPA routing",
		},
		{
			name:         "nested route falls back to root",
			path:         "/users/123/profile",
			fileExists:   false,
			expectedPath: "/",
			description:  "Nested routes should fall back to root for SPA routing",
		},
		{
			name:         "file with query params",
			path:         "/app.js?v=123",
			fileExists:   true,
			expectedPath: "/app.js",
			description:  "Query params are stripped in file server path",
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			// Setup mock filesystem
			mockFS := &mockFileSystem{
				files: make(map[string]mockFile),
			}
			if tc.fileExists {
				// Store file without query parameters for filesystem lookup
				filePath := tc.path
				if idx := strings.IndexByte(filePath, '?'); idx != -1 {
					filePath = filePath[:idx]
				}
				mockFS.files[filePath] = mockFile{
					content: "mock file content",
				}
			}

			// Setup file server that tracks the request path
			var requestedPath string
			fileServer := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				requestedPath = r.URL.Path
				w.WriteHeader(http.StatusOK)
				w.Write([]byte("SPA content"))
			})

			handler := &assetHandler{
				FileSystem: mockFS,
				FileServer: fileServer,
				Next:       &mockNextHandler{},
			}

			// Create request and response recorder
			req := httptest.NewRequest("GET", tc.path, nil)
			w := httptest.NewRecorder()

			// Execute
			handler.ServeHTTP(w, req)

			// Assertions
			assert.Equal(t, http.StatusOK, w.Code)
			assert.Equal(t, tc.expectedPath, requestedPath, tc.description)
		})
	}
}

func TestAssetHandler_ServeHTTP_FileSystemErrors(t *testing.T) {
	t.Run("file system open error for static asset", func(t *testing.T) {
		mockFS := &mockFileSystem{
			files: map[string]mockFile{
				"/favicon.ico": {
					err: errors.New("permission denied"),
				},
			},
		}

		mockNext := &mockNextHandler{}
		mockFileServer := &mockFileServer{response: "fallback response"}

		handler := &assetHandler{
			FileSystem: mockFS,
			FileServer: mockFileServer,
			Next:       mockNext,
		}

		req := httptest.NewRequest("GET", "/favicon.ico", nil)
		w := httptest.NewRecorder()

		handler.ServeHTTP(w, req)

		// Should fall back to file server when static asset can't be opened
		assert.False(t, mockNext.called)
		assert.True(t, mockFileServer.called)
		assert.Equal(t, "fallback response", w.Body.String())
	})

	t.Run("file system open error for regular file", func(t *testing.T) {
		mockFS := &mockFileSystem{
			files: map[string]mockFile{
				"/dashboard": {
					err: errors.New("file not found"),
				},
			},
		}

		var requestedPath string
		fileServer := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			requestedPath = r.URL.Path
			w.WriteHeader(http.StatusOK)
		})

		handler := &assetHandler{
			FileSystem: mockFS,
			FileServer: fileServer,
			Next:       &mockNextHandler{},
		}

		req := httptest.NewRequest("GET", "/dashboard", nil)
		w := httptest.NewRecorder()

		handler.ServeHTTP(w, req)

		// Should fall back to root path when file doesn't exist
		assert.Equal(t, "/", requestedPath)
	})
}

func TestAssetHandler_ServeHTTP_HTTPMethods(t *testing.T) {
	methods := []string{"GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"}

	for _, method := range methods {
		t.Run("method_"+method, func(t *testing.T) {
			mockNext := &mockNextHandler{response: "API response"}
			mockFileServer := &mockFileServer{response: "file server response"}
			mockFS := &mockFileSystem{files: make(map[string]mockFile)}

			handler := &assetHandler{
				FileSystem: mockFS,
				FileServer: mockFileServer,
				Next:       mockNext,
			}

			// Test API route
			req := httptest.NewRequest(method, "/api/v1/test", nil)
			w := httptest.NewRecorder()

			handler.ServeHTTP(w, req)

			assert.True(t, mockNext.called, "Next handler should be called for API routes regardless of method")
			assert.False(t, mockFileServer.called, "File server should not be called for API routes")

			// Reset for next test
			mockNext.called = false
			mockFileServer.called = false

			// Test non-API route
			req = httptest.NewRequest(method, "/dashboard", nil)
			w = httptest.NewRecorder()

			handler.ServeHTTP(w, req)

			assert.False(t, mockNext.called, "Next handler should not be called for non-API routes")
			assert.True(t, mockFileServer.called, "File server should be called for non-API routes regardless of method")
		})
	}
}

func TestAssetHandler_ServeHTTP_EdgeCases(t *testing.T) {
	t.Run("empty path", func(t *testing.T) {
		mockNext := &mockNextHandler{}
		mockFileServer := &mockFileServer{response: "root response"}
		mockFS := &mockFileSystem{files: make(map[string]mockFile)}

		handler := &assetHandler{
			FileSystem: mockFS,
			FileServer: mockFileServer,
			Next:       mockNext,
		}

		req := httptest.NewRequest("GET", "/", nil)
		req.URL.Path = ""
		w := httptest.NewRecorder()

		handler.ServeHTTP(w, req)

		assert.False(t, mockNext.called)
		assert.True(t, mockFileServer.called)
	})

	t.Run("path with multiple slashes", func(t *testing.T) {
		mockNext := &mockNextHandler{response: "API response"}
		mockFileServer := &mockFileServer{}
		mockFS := &mockFileSystem{files: make(map[string]mockFile)}

		handler := &assetHandler{
			FileSystem: mockFS,
			FileServer: mockFileServer,
			Next:       mockNext,
		}

		req := httptest.NewRequest("GET", "//api//v1//test", nil)
		w := httptest.NewRecorder()

		handler.ServeHTTP(w, req)

		// Multiple slashes don't match the API pattern
		assert.False(t, mockNext.called)
		assert.True(t, mockFileServer.called)
	})

	t.Run("case sensitivity", func(t *testing.T) {
		testCases := []struct {
			path           string
			expectNextCall bool
		}{
			{"/API/v1/test", false}, // uppercase
			{"/Auth/login", false},  // mixed case
			{"/api/V1/test", false}, // uppercase version number
		}

		for _, tc := range testCases {
			mockNext := &mockNextHandler{response: "API response"}
			mockFileServer := &mockFileServer{response: "file response"}
			mockFS := &mockFileSystem{files: make(map[string]mockFile)}

			handler := &assetHandler{
				FileSystem: mockFS,
				FileServer: mockFileServer,
				Next:       mockNext,
			}

			req := httptest.NewRequest("GET", tc.path, nil)
			w := httptest.NewRecorder()

			handler.ServeHTTP(w, req)

			assert.Equal(t, tc.expectNextCall, mockNext.called, "Path: %s", tc.path)
		}
	})
}

func TestAPIPattern(t *testing.T) {
	testCases := []struct {
		path     string
		expected bool
	}{
		// Auth routes
		{"/auth/", true},
		{"/auth/login", true},
		{"/auth/logout", true},
		{"/auth/callback", true},

		// API routes
		{"/api/v1/", true},
		{"/api/v1/users", true},
		{"/api/v2/applications", true},
		{"/api/v10/test", true},
		{"/api/v999/resource", true},

		// Non-matching paths
		{"/api/", false},
		{"/api", false},
		{"/api/test", false},
		{"/api/version/test", false},
		{"/authenticate", false},
		{"/authorization", false},
		{"/dashboard", false},
		{"/", false},
		{"", false},

		// Edge cases
		{"/auth", false},           // missing trailing slash
		{"/api/v", false},          // incomplete version
		{"/api/v1a/test", false},   // invalid version format
		{"/prefix/auth/", false},   // auth not at start
		{"/prefix/api/v1/", false}, // api not at start
	}

	for _, tc := range testCases {
		t.Run(tc.path, func(t *testing.T) {
			result := apiPattern.MatchString(tc.path)
			assert.Equal(t, tc.expected, result, "Path: %s", tc.path)
		})
	}
}

// Benchmark tests
func BenchmarkAssetHandler_StaticAsset(b *testing.B) {
	mockFS := &mockFileSystem{
		files: map[string]mockFile{
			"/favicon.ico": {content: "icon content"},
		},
	}

	handler := &assetHandler{
		FileSystem: mockFS,
		FileServer: &mockFileServer{},
		Next:       &mockNextHandler{},
	}

	req := httptest.NewRequest("GET", "/favicon.ico", nil)

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		w := httptest.NewRecorder()
		handler.ServeHTTP(w, req)
	}
}

func BenchmarkAssetHandler_APIRoute(b *testing.B) {
	handler := &assetHandler{
		FileSystem: &mockFileSystem{files: make(map[string]mockFile)},
		FileServer: &mockFileServer{},
		Next:       &mockNextHandler{},
	}

	req := httptest.NewRequest("GET", "/api/v1/users", nil)

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		w := httptest.NewRecorder()
		handler.ServeHTTP(w, req)
	}
}

func BenchmarkAPIPattern(b *testing.B) {
	paths := []string{
		"/api/v1/users",
		"/auth/login",
		"/dashboard",
		"/static/js/app.js",
		"/healthcheck",
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		path := paths[i%len(paths)]
		apiPattern.MatchString(path)
	}
}
