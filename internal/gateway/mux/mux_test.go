package mux

import (
	"context"
	"go.admiral.io/admiral/internal/config"
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"

	"github.com/grpc-ecosystem/grpc-gateway/v2/runtime"
	"github.com/stretchr/testify/assert"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"

	healthcheckv1 "go.admiral.io/admiral/api/healthcheck/v1"
)

func TestCustomHeaderMatcher(t *testing.T) {
	testCases := []struct {
		key          string
		expectedKey  string
		expectedBool bool
	}{
		{
			key:          "X-Foo-Bar",
			expectedKey:  "grpcgateway-X-Foo-Bar",
			expectedBool: true,
		},
		// testing that the headers get uppercased
		{
			key:          "x-foo-bar",
			expectedKey:  "grpcgateway-X-Foo-Bar",
			expectedBool: true,
		},
		// testing the default rule - isPermanentHTTPHeader group
		{
			key:          "Cookie",
			expectedKey:  "grpcgateway-Cookie",
			expectedBool: true,
		},
		// testing the default rule - Grpc-Metadata prefix
		{
			key:          "Grpc-Metadata-Foo",
			expectedKey:  "Foo",
			expectedBool: true,
		},
		// testing the prefix doesn't get applied and doesn't match default rule
		{
			key:          xForwardedFor,
			expectedKey:  "",
			expectedBool: false,
		},
		// testing the prefix doesn't get applied and doesn't match default rule
		{
			key:          xForwardedHost,
			expectedKey:  "",
			expectedBool: false,
		},
		// doesn't match custom or default rules
		{
			key:          "Foo-Bar",
			expectedKey:  "",
			expectedBool: false,
		},
	}

	for _, test := range testCases {
		result, ok := customHeaderMatcher(test.key)
		assert.Equal(t, test.expectedKey, result)
		assert.Equal(t, test.expectedBool, ok)
	}
}

func TestCustomErrorHandler(t *testing.T) {
	ctx := context.Background()
	mux := runtime.NewServeMux()
	marshaler := &runtime.JSONPb{}

	{
		// Business as usual.
		req := &http.Request{}
		rec := httptest.NewRecorder()
		w := mockResponseWriter{ResponseWriter: rec}
		err := status.Error(codes.NotFound, "not found")
		customErrorHandler(ctx, mux, marshaler, w, req, err)
		assert.Equal(t, 404, rec.Code)
	}
	{
		// Auth redirect for browser 401.
		uri := "https://example.com/bar?foo=bar"
		req, _ := http.NewRequest("GET", uri, nil)
		req.RequestURI = uri
		req.Header.Add("Accept", "text/html")
		rec := httptest.NewRecorder()
		w := mockResponseWriter{ResponseWriter: rec}
		err := status.Error(codes.Unauthenticated, "not found")
		customErrorHandler(ctx, mux, marshaler, w, req, err)
		assert.Equal(t, 302, rec.Code)
		assert.Contains(t, rec.Header().Get("Location"), url.QueryEscape(uri))
	}
	{
		// No auth redirect for non-browser 401.
		uri := "https://example.com/bar?foo=bar"
		req, _ := http.NewRequest(http.MethodGet, uri, nil)
		req.RequestURI = uri
		rec := httptest.NewRecorder()
		w := mockResponseWriter{ResponseWriter: rec}
		err := status.Error(codes.Unauthenticated, "not found")
		customErrorHandler(ctx, mux, marshaler, w, req, err)
		assert.Equal(t, 401, rec.Code)
	}
}

func TestCustomResponseForwarder(t *testing.T) {
	ctx := runtime.NewServerMetadataContext(context.Background(), runtime.ServerMetadata{})
	rec := httptest.NewRecorder()
	w := mockResponseWriter{ResponseWriter: rec}
	err := newCustomResponseForwarder(&config.Cookies{HttpOnly: false, Secure: false})(ctx, w, &healthcheckv1.HealthcheckResponse{})
	assert.NoError(t, err)
	assert.Equal(t, 200, rec.Code)
}

func TestCustomResponseForwarderAuthCookies(t *testing.T) {
	ctx := runtime.NewServerMetadataContext(context.Background(), runtime.ServerMetadata{
		HeaderMD: metadata.Pairs(
			"Set-Cookie-Session", "mySessionId",
			"Location", "https://example.com",
		),
	})

	rec := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodGet, "https://example.com/bar", nil)
	req.Header.Add("Accept", "text/html") // Is browser.
	w := &mockResponseWriter{ResponseWriter: rec, req: req}
	err := newCustomResponseForwarder(&config.Cookies{HttpOnly: true, Secure: true})(ctx, w, &healthcheckv1.HealthcheckResponse{})
	assert.NoError(t, err)
	assert.Equal(t, 302, rec.Code)
	assert.Equal(t, "session=mySessionId; Path=/; HttpOnly; Secure; SameSite=Lax", rec.Header().Get("Set-Cookie"))
	assert.Equal(t, "https://example.com", rec.Header().Get("Location"))
}

func TestCustomResponseForwarderLocationStatusOverrideAndRefreshToken(t *testing.T) {
	ctx := runtime.NewServerMetadataContext(context.Background(), runtime.ServerMetadata{
		HeaderMD: metadata.Pairs(
			"Set-Cookie-Session", "mySessionId",
			"Location", "https://example.com",
			"Location-Status", "304",
		),
	})

	rec := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodGet, "https://example.com/bar", nil)
	req.Header.Add("Accept", "text/html") // Is browser.
	w := &mockResponseWriter{ResponseWriter: rec, req: req}
	err := newCustomResponseForwarder(&config.Cookies{HttpOnly: true, Secure: true})(ctx, w, &healthcheckv1.HealthcheckResponse{})
	assert.NoError(t, err)
	assert.Equal(t, 304, rec.Code)
	assert.Contains(t, rec.Header().Values("Set-Cookie"), "session=mySessionId; Path=/; HttpOnly; Secure; SameSite=Lax")
	assert.Equal(t, "https://example.com", rec.Header().Get("Location"))
}

func TestCustomResponseForwarderAuthCookiesNonBrowser(t *testing.T) {
	ctx := runtime.NewServerMetadataContext(context.Background(), runtime.ServerMetadata{
		HeaderMD: metadata.Pairs(
			"Location", "https://example.com",
		),
	})

	rec := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodGet, "https://example.com/bar", nil)
	req.Header.Add("Accept", "*/*") // Not a browser!
	w := &mockResponseWriter{ResponseWriter: rec, req: req}
	err := newCustomResponseForwarder(&config.Cookies{HttpOnly: false, Secure: false})(ctx, w, &healthcheckv1.HealthcheckResponse{})
	assert.NoError(t, err)
	assert.Equal(t, 200, rec.Code)
	assert.Equal(t, "", rec.Header().Get("Location"))
}
