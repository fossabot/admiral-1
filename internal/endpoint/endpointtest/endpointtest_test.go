package endpointtest

import (
	"context"
	"testing"

	"github.com/grpc-ecosystem/grpc-gateway/v2/runtime"
	"github.com/stretchr/testify/assert"
	"google.golang.org/grpc"
)

type DummyServiceServer interface{}

func dummyHandler(ctx context.Context, mux *runtime.ServeMux, conn *grpc.ClientConn) error {
	return nil
}

type dummyService struct{}

var dummyServiceDesc = grpc.ServiceDesc{
	ServiceName: "test.service",

	HandlerType: (*DummyServiceServer)(nil),
	Methods: []grpc.MethodDesc{
		{
			MethodName: "DummyMethod",
			Handler:    nil,
		},
	},
	Streams:  []grpc.StreamDesc{},
	Metadata: "dummy.proto",
}

func TestNewRegisterChecker(t *testing.T) {
	registrar := NewRegisterChecker()

	// Initially, no JSON or gRPC registration should be present.
	assert.False(t, registrar.JSONRegistered(), "expected JSONRegistered to be false initially")
	assert.False(t, registrar.GRPCRegistered(), "expected GRPCRegistered to be false initially")
}

func TestGRPCRegistration(t *testing.T) {
	registrar := NewRegisterChecker()
	registrar.GRPCServer().RegisterService(&dummyServiceDesc, &dummyService{})

	// GRPCRegistered should now return true.
	assert.True(t, registrar.GRPCRegistered(), "expected GRPCRegistered to be true after registration")

	// HasAPI should successfully locate the registered service.
	err := registrar.HasAPI("test.service")
	assert.NoError(t, err, "expected HasAPI to find 'test.service'")

	// HasAPI should return an error for a non-existent service.
	err = registrar.HasAPI("nonexistent.service")
	assert.Error(t, err, "expected HasAPI to return error for unknown service")
}

func TestRegisterJSONGateway_Success(t *testing.T) {
	registrar := NewRegisterChecker()
	registrar.GRPCServer().RegisterService(&dummyServiceDesc, &dummyService{})

	assert.NotPanics(t, func() {
		err := registrar.RegisterJSONGateway(dummyHandler)
		assert.NoError(t, err, "expected RegisterJSONGateway to succeed")
	}, "RegisterJSONGateway should not panic when counts match")

	// JSONRegistered should now return true.
	assert.True(t, registrar.JSONRegistered(), "expected JSONRegistered to be true after registration")
}

func TestRegisterJSONGateway_Panic_When_NoGRPCService(t *testing.T) {
	registrar := NewRegisterChecker()

	assert.Panics(t, func() {
		_ = registrar.RegisterJSONGateway(dummyHandler)
	}, "expected RegisterJSONGateway to panic when no GRPC service is registered")
}
