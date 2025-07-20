package errorintercept

import (
	"context"
	"errors"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/uber-go/tally/v4"
	"go.uber.org/zap"
	"google.golang.org/grpc"

	healthcheckv1 "go.admiral.io/admiral/api/healthcheck/v1"
	"go.admiral.io/admiral/internal/config"
)

func TestNew(t *testing.T) {
	testCases := []struct {
		name   string
		cfg    *config.Config
		logger *zap.Logger
		scope  tally.Scope
	}{
		{
			name:   "nil parameters",
			cfg:    nil,
			logger: nil,
			scope:  nil,
		},
		{
			name:   "valid parameters",
			cfg:    &config.Config{},
			logger: zap.NewNop(),
			scope:  tally.NoopScope,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			m, err := New(tc.cfg, tc.logger, tc.scope)
			assert.NoError(t, err)
			assert.NotNil(t, m)
			assert.IsType(t, &Middleware{}, m)
		})
	}
}

func TestNewMiddleware(t *testing.T) {
	testCases := []struct {
		name   string
		cfg    *config.Config
		logger *zap.Logger
		scope  tally.Scope
	}{
		{
			name:   "nil parameters",
			cfg:    nil,
			logger: nil,
			scope:  nil,
		},
		{
			name:   "valid parameters",
			cfg:    &config.Config{},
			logger: zap.NewNop(),
			scope:  tally.NoopScope,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			m, err := NewMiddleware(tc.cfg, tc.logger, tc.scope)
			assert.NoError(t, err)
			assert.NotNil(t, m)
			assert.IsType(t, &Middleware{}, m)
			assert.Empty(t, m.interceptors)
		})
	}
}

func TestMiddleware_AddInterceptor(t *testing.T) {
	m := &Middleware{}

	t.Run("add single interceptor", func(t *testing.T) {
		interceptor := func(err error) error { return err }
		m.AddInterceptor(interceptor)
		assert.Len(t, m.interceptors, 1)
	})

	t.Run("add multiple interceptors", func(t *testing.T) {
		m := &Middleware{}
		interceptor1 := func(err error) error { return err }
		interceptor2 := func(err error) error { return err }
		interceptor3 := func(err error) error { return err }

		m.AddInterceptor(interceptor1)
		m.AddInterceptor(interceptor2)
		m.AddInterceptor(interceptor3)

		assert.Len(t, m.interceptors, 3)
	})

	t.Run("add nil interceptor", func(t *testing.T) {
		m := &Middleware{}
		var nilInterceptor errorInterceptorFunc

		m.AddInterceptor(nilInterceptor)
		assert.Len(t, m.interceptors, 1)
		assert.Nil(t, m.interceptors[0])
	})
}

func TestMiddleware_UnaryInterceptor_NoError(t *testing.T) {
	testCases := []struct {
		name             string
		interceptorCount int
		expectedResp     interface{}
	}{
		{
			name:             "no interceptors",
			interceptorCount: 0,
			expectedResp:     &healthcheckv1.HealthcheckResponse{},
		},
		{
			name:             "with interceptors",
			interceptorCount: 3,
			expectedResp:     &healthcheckv1.HealthcheckResponse{},
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			m := &Middleware{}
			handler := func(ctx context.Context, req interface{}) (interface{}, error) {
				return tc.expectedResp, nil
			}

			for i := 0; i < tc.interceptorCount; i++ {
				m.AddInterceptor(func(err error) error {
					t.Fatal("interceptor should not be called when no error")
					return err
				})
			}

			interceptor := m.UnaryInterceptor()
			resp, err := interceptor(context.Background(), nil, &grpc.UnaryServerInfo{FullMethod: "/test/method"}, handler)

			assert.NoError(t, err)
			assert.Equal(t, tc.expectedResp, resp)
		})
	}
}

func TestMiddleware_UnaryInterceptor_WithError(t *testing.T) {
	testCases := []struct {
		name           string
		originalError  error
		interceptors   []errorInterceptorFunc
		expectedError  error
		expectResponse bool
	}{
		{
			name:          "single interceptor transforms error",
			originalError: errors.New("original error"),
			interceptors: []errorInterceptorFunc{
				func(err error) error {
					return errors.New("transformed error")
				},
			},
			expectedError:  errors.New("transformed error"),
			expectResponse: true,
		},
		{
			name:          "multiple interceptors apply in reverse order",
			originalError: errors.New("original"),
			interceptors: []errorInterceptorFunc{
				func(err error) error {
					return errors.New("first: " + err.Error())
				},
				func(err error) error {
					return errors.New("second: " + err.Error())
				},
			},
			expectedError:  errors.New("first: second: original"),
			expectResponse: true,
		},
		{
			name:          "interceptor returns nil to clear error",
			originalError: errors.New("original error"),
			interceptors: []errorInterceptorFunc{
				func(err error) error {
					return nil
				},
			},
			expectedError:  nil,
			expectResponse: true,
		},
		{
			name:          "interceptor preserves original error",
			originalError: errors.New("preserve me"),
			interceptors: []errorInterceptorFunc{
				func(err error) error {
					return err
				},
			},
			expectedError:  errors.New("preserve me"),
			expectResponse: true,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			m := &Middleware{}
			handler := func(ctx context.Context, req interface{}) (interface{}, error) {
				return &healthcheckv1.HealthcheckResponse{}, tc.originalError
			}

			for _, interceptor := range tc.interceptors {
				m.AddInterceptor(interceptor)
			}

			interceptor := m.UnaryInterceptor()
			resp, err := interceptor(context.Background(), nil, &grpc.UnaryServerInfo{FullMethod: "/test/method"}, handler)

			if tc.expectedError != nil {
				assert.Error(t, err)
				assert.Equal(t, tc.expectedError.Error(), err.Error())
			} else {
				assert.NoError(t, err)
			}

			assert.NotNil(t, resp) // Response is always returned from handler regardless of error
		})
	}
}

func TestMiddleware_UnaryInterceptor_Context(t *testing.T) {
	testCases := []struct {
		name    string
		ctx     context.Context
		request interface{}
		info    *grpc.UnaryServerInfo
	}{
		{
			name:    "background context",
			ctx:     context.Background(),
			request: &healthcheckv1.HealthcheckRequest{},
			info:    &grpc.UnaryServerInfo{FullMethod: "/healthcheck/v1/check"},
		},
		{
			name: "context with timeout",
			ctx: func() context.Context {
				ctx, cancel := context.WithCancel(context.Background())
				defer cancel()
				return ctx
			}(),
			request: nil,
			info:    &grpc.UnaryServerInfo{FullMethod: "/test/method"},
		},
		{
			name:    "nil request",
			ctx:     context.Background(),
			request: nil,
			info:    &grpc.UnaryServerInfo{FullMethod: "/test/nil"},
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			m := &Middleware{}
			handler := func(ctx context.Context, req interface{}) (interface{}, error) {
				assert.Equal(t, tc.ctx, ctx)
				assert.Equal(t, tc.request, req)
				return &healthcheckv1.HealthcheckResponse{}, nil
			}

			interceptor := m.UnaryInterceptor()
			resp, err := interceptor(tc.ctx, tc.request, tc.info, handler)

			assert.NoError(t, err)
			assert.NotNil(t, resp)
		})
	}
}

func TestMiddleware_UnaryInterceptor_ErrorChaining(t *testing.T) {
	m := &Middleware{}
	originalErr := errors.New("original error")

	var executionOrder []string

	m.AddInterceptor(func(err error) error {
		executionOrder = append(executionOrder, "first")
		return errors.New("first: " + err.Error())
	})

	m.AddInterceptor(func(err error) error {
		executionOrder = append(executionOrder, "second")
		return errors.New("second: " + err.Error())
	})

	m.AddInterceptor(func(err error) error {
		executionOrder = append(executionOrder, "third")
		return errors.New("third: " + err.Error())
	})

	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return nil, originalErr
	}

	interceptor := m.UnaryInterceptor()
	resp, err := interceptor(context.Background(), nil, &grpc.UnaryServerInfo{FullMethod: "/test"}, handler)

	assert.Error(t, err)
	assert.Nil(t, resp) // Handler returned nil response
	assert.Equal(t, []string{"third", "second", "first"}, executionOrder)
	assert.Equal(t, "first: second: third: original error", err.Error())
}

func TestMiddleware_UnaryInterceptor_EdgeCases(t *testing.T) {
	t.Run("handler panics", func(t *testing.T) {
		m := &Middleware{}
		handler := func(ctx context.Context, req interface{}) (interface{}, error) {
			panic("handler panic")
		}

		interceptor := m.UnaryInterceptor()

		assert.Panics(t, func() {
			_, _ = interceptor(context.Background(), nil, &grpc.UnaryServerInfo{FullMethod: "/test"}, handler)
		})
	})

	t.Run("interceptor panics", func(t *testing.T) {
		m := &Middleware{}
		m.AddInterceptor(func(err error) error {
			panic("interceptor panic")
		})

		handler := func(ctx context.Context, req interface{}) (interface{}, error) {
			return nil, errors.New("test error")
		}

		interceptor := m.UnaryInterceptor()

		assert.Panics(t, func() {
			_, _ = interceptor(context.Background(), nil, &grpc.UnaryServerInfo{FullMethod: "/test"}, handler)
		})
	})

	t.Run("nil handler", func(t *testing.T) {
		m := &Middleware{}
		interceptor := m.UnaryInterceptor()

		assert.Panics(t, func() {
			_, _ = interceptor(context.Background(), nil, &grpc.UnaryServerInfo{FullMethod: "/test"}, nil)
		})
	})
}

func TestConstants(t *testing.T) {
	assert.Equal(t, "middleware.errorintercept", Name)
}

func TestInterceptorInterface(t *testing.T) {
	t.Run("interface implementation", func(t *testing.T) {
		var interceptor Interceptor

		mockInterceptor := &mockInterceptor{}
		interceptor = mockInterceptor

		testErr := errors.New("test error")
		result := interceptor.InterceptError(testErr)

		assert.Equal(t, testErr, result)
	})
}

type mockInterceptor struct{}

func (m *mockInterceptor) InterceptError(err error) error {
	return err
}

func TestMiddleware_ConcurrentAccess(t *testing.T) {
	m := &Middleware{}

	numGoroutines := 100
	numInterceptors := 10

	for i := 0; i < numInterceptors; i++ {
		interceptorID := i
		m.AddInterceptor(func(err error) error {
			return errors.New(err.Error() + " processed by " + string(rune('A'+interceptorID)))
		})
	}

	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return nil, errors.New("base error")
	}

	interceptor := m.UnaryInterceptor()

	done := make(chan bool, numGoroutines)

	for i := 0; i < numGoroutines; i++ {
		go func() {
			defer func() { done <- true }()

			resp, err := interceptor(context.Background(), nil, &grpc.UnaryServerInfo{FullMethod: "/concurrent/test"}, handler)

			assert.Error(t, err)
			assert.Nil(t, resp) // Handler returned nil response
		}()
	}

	for i := 0; i < numGoroutines; i++ {
		<-done
	}
}
