package meta

import (
	"fmt"

	"github.com/jhump/protoreflect/desc" //nolint:staticcheck // Required for gRPC reflection functionality
	"github.com/jhump/protoreflect/grpcreflect"
	"google.golang.org/grpc"
	"google.golang.org/protobuf/proto"
	"google.golang.org/protobuf/reflect/protoreflect"
	"google.golang.org/protobuf/types/known/anypb"
)

var methodDescriptors map[string]*desc.MethodDescriptor

func APIBody(body interface{}) (*anypb.Any, error) {
	m, ok := body.(proto.Message)
	if !ok {
		// body is not the model/value we want to process
		return nil, nil
	}

	// Deep copy before field redaction so we do not unintentionally remove fields
	// from the original object that were passed by reference
	m = proto.Clone(m)
	return anypb.New(ClearLogDisabledFields(m))
}

func GenerateGRPCMetadata(server *grpc.Server) error {
	serviceDescriptors, err := grpcreflect.LoadServiceDescriptors(server)
	if err != nil {
		return err
	}

	mds := make(map[string]*desc.MethodDescriptor)
	for _, sd := range serviceDescriptors {
		for _, md := range sd.GetMethods() {
			methodName := fmt.Sprintf("/%s/%s", sd.GetFullyQualifiedName(), md.GetName())
			mds[methodName] = md
		}
	}

	methodDescriptors = mds
	return nil
}

func ClearLogDisabledFields(m proto.Message) proto.Message {
	if m == nil {
		return m
	}

	pb := m.ProtoReflect()
	pb.Range(func(fd protoreflect.FieldDescriptor, v protoreflect.Value) bool {
		// Handle nested types.
		switch t := v.Interface().(type) {
		case protoreflect.Message:
			ClearLogDisabledFields(t.Interface())
		case protoreflect.Map:
			t.Range(func(k protoreflect.MapKey, v protoreflect.Value) bool {
				if _, ok := v.Interface().(protoreflect.Message); ok {
					ClearLogDisabledFields(v.Message().Interface())
				}
				return true
			})
		case protoreflect.List: // i.e. `repeated`.
			for i := 0; i < t.Len(); i++ {
				if _, ok := t.Get(i).Interface().(protoreflect.Message); ok {
					ClearLogDisabledFields(t.Get(i).Message().Interface())
				}
			}
		}
		return true
	})

	return m
}
