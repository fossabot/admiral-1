package gateway

import (
	"go.admiral.io/admiral/internal/endpoint"
	"go.admiral.io/admiral/internal/endpoint/application"
	authnendp "go.admiral.io/admiral/internal/endpoint/authn"
	"go.admiral.io/admiral/internal/endpoint/cluster"
	"go.admiral.io/admiral/internal/endpoint/environment"
	"go.admiral.io/admiral/internal/endpoint/healthcheck"
	"go.admiral.io/admiral/internal/endpoint/manifest"
	"go.admiral.io/admiral/internal/endpoint/revision"
	"go.admiral.io/admiral/internal/endpoint/user"
	"go.admiral.io/admiral/internal/endpoint/variable"
	"go.admiral.io/admiral/internal/middleware"
	"go.admiral.io/admiral/internal/middleware/authn"
	"go.admiral.io/admiral/internal/middleware/stats"
	"go.admiral.io/admiral/internal/middleware/validate"
	"go.admiral.io/admiral/internal/service"
	authnservice "go.admiral.io/admiral/internal/service/authn"
	"go.admiral.io/admiral/internal/service/database"
	"go.admiral.io/admiral/internal/service/objectstorage"
	"go.admiral.io/admiral/internal/service/session"
)

var Services = service.Factory{
	{Name: database.Name, Factory: database.New},
	{Name: authnservice.Name, Factory: authnservice.New},
	{Name: session.Name, Factory: session.New},
	{Name: objectstorage.Name, Factory: objectstorage.New},
}

var Middleware = middleware.Factory{
	authn.Name:    authn.New,
	validate.Name: validate.New,
	stats.Name:    stats.New,
}

var Endpoints = endpoint.Factory{
	authnendp.Name:   authnendp.New,
	application.Name: application.New,
	environment.Name: environment.New,
	cluster.Name:     cluster.New,
	healthcheck.Name: healthcheck.New,
	manifest.Name:    manifest.New,
	revision.Name:    revision.New,
	variable.Name:    variable.New,
	user.Name:        user.New,
}

var CoreComponentFactory = &ComponentFactory{
	Services:   Services,
	Middleware: Middleware,
	Endpoints:  Endpoints,
}
