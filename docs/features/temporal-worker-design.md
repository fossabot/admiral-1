# Temporal Worker Process Design

## Overview

Admiral requires a separate Temporal worker process to execute long-running infrastructure provisioning and deployment workflows. This document outlines the design for implementing the worker process within the existing Admiral repository.

**Status**: Design Phase - Ready for Implementation  
**Epic**: Temporal Worker Process  
**Estimated Effort**: 3-4 sprints  
**Dependencies**: Existing Temporal client service (`internal/service/temporal/`)

## Architecture

### Multi-Binary Approach

Admiral will use a single repository with multiple binary entry points:

- **`admiral-server`** - Existing gRPC API server that submits workflow requests to Temporal
- **`admiral-worker`** - New Temporal worker process that listens to Temporal and executes workflow steps

### Key Benefits

- **Shared Codebase**: Workers reuse models, services, configuration, and database access
- **Simple Deployment**: Single Docker image with two entry points
- **Code Consistency**: Same linting, testing, and CI/CD processes
- **Development Simplicity**: Single repository checkout with familiar patterns

## Implementation Structure

### Main Entry Point Changes

**Current**: `main.go` calls `server.Execute()` directly  
**Required**: Support both `admiral-server` and `admiral-worker` binaries

**Approach 1 - Separate Binaries (Recommended):**
```go
// cmd/worker/main.go - New file
package main

func main() {
    worker.Execute(buildInfo(...), os.Exit, os.Args[1:])
}

// main.go - Keep unchanged for server
```

**Approach 2 - Single Binary with Subcommands:**
```go
// main.go - Modified
func main() {
    if len(os.Args) > 1 && os.Args[1] == "worker" {
        worker.Execute(buildInfo(...), os.Exit, os.Args[2:])
    } else {
        server.Execute(buildInfo(...), os.Exit, os.Args[1:])
    }
}
```

**Recommendation**: Use Approach 1 for cleaner separation and easier Docker deployment

### Command Structure

```
cmd/
├── server/           # Existing server commands
│   ├── root.go
│   ├── start.go
│   └── migrate.go
└── worker/           # New worker commands
    ├── main.go       # Worker main entry point (if separate binary)
    ├── root.go       # Worker root command with shared config
    ├── start.go      # Worker start command with task queues
    └── migrate.go    # Optional: worker-specific migrations
```

**Implementation Details:**
- Copy structure from `cmd/server/` as template
- Worker uses same config file (`config.yaml`) and CLI flags as server
- Reuse existing patterns from `cmd/server/root.go` for consistency

### Workflow Definitions

```
internal/
├── workflow/         # New workflow package
│   ├── infrastructure/
│   │   ├── activities.go    # Terraform execution activities
│   │   ├── workflow.go      # Infrastructure provisioning workflow
│   │   └── types.go         # Workflow-specific types
│   ├── deployment/
│   │   ├── activities.go    # Kubernetes deployment activities
│   │   ├── workflow.go      # Application deployment workflow
│   │   └── types.go         # Deployment-specific types
│   ├── registry.go          # Worker task registration
│   └── common.go            # Shared workflow utilities
```

### Workflow Types

#### Infrastructure Provisioning Workflow
- **Purpose**: Execute Terraform modules in DAG order with variable injection
- **Activities**:
  - DAG resolution and dependency analysis
  - Terraform module execution with variable injection
  - Output capture and variable pool enhancement
  - Error handling and rollback capabilities

#### Application Deployment Workflow  
- **Purpose**: Process manifests and coordinate deployment
- **Activities**:
  - Template processing with effective variables
  - Manifest generation and validation
  - Revision creation and storage
  - Kubernetes controller notification

### Configuration Integration

Workers will extend the existing configuration system in `internal/config/config.go`:

```yaml
# config.yaml (additions to existing structure)
services:
  temporal:
    host: localhost
    port: 7233

worker:
  task_queues:
    - infrastructure
    - deployment
  max_concurrent_activities: 10
  max_concurrent_workflows: 5
  namespace: "default"  # Temporal namespace
```

**Required Code Changes:**
1. Add `Worker` struct to `internal/config/config.go`
2. Add validation method for worker config
3. Update config loading in both server and worker root commands

## Development Workflow

### Makefile Updates

Add to existing `Makefile` (follows existing patterns):

```makefile
.PHONY: worker # Build the worker binary
worker: preflight-checks-go
	go build -o ./build/admiral-worker ./cmd/worker \
		-ldflags="-s -w -X main.version=$(VERSION) -X main.commit=$(COMMIT) -X main.date=$(DATE) -X main.builtBy=$(BUILT_BY)"

.PHONY: worker-dev # Start worker in development mode
worker-dev: preflight-checks-go
	$(AIR) -c cmd/worker/.air.toml

.PHONY: dev-all # Run server + worker + web in parallel
dev-all:
	$(MAKE) -j3 server-dev worker-dev web-dev

.PHONY: worker-test # Run worker-specific tests
worker-test: preflight-checks-go
	go test -race -covermode=atomic ./internal/workflow/...
```

**Integration Notes:**
- Update existing `all` target to include worker: `all: server worker web`
- Update existing `test` target to include worker tests
- Follow same build flags pattern as server binary

### Air Configuration

Create `cmd/worker/.air.toml` following existing pattern from server:

```toml
# cmd/worker/.air.toml (copy from server and modify paths)
[build]
  bin = "./tmp/admiral-worker"
  cmd = "go build -o ./tmp/admiral-worker ./cmd/worker"

[misc]
  clean_on_exit = true
```

**Setup Steps:**
1. Copy existing Air config from server
2. Update binary name and cmd path
3. Same file watching patterns as server

### Docker Compose Integration

```yaml
# deploy/docker-compose/docker-compose.yaml
services:
  admiral-worker:
    build: ../..
    command: ["./admiral-worker", "start", "--config", "config.yaml", "--env", ".env.dev"]
    depends_on:
      - temporal
      - postgres
    volumes:
      - .:/workspace
```

## Temporal Integration

### Task Queues

- **`infrastructure`** - Infrastructure provisioning workflows
- **`deployment`** - Application deployment workflows
- **`default`** - General purpose workflows

### Workflow Execution Flow

1. **Server** receives API request for infrastructure/deployment
2. **Server** submits workflow to appropriate Temporal task queue
3. **Worker** picks up workflow from task queue
4. **Worker** executes activities (Terraform, template processing, etc.)
5. **Worker** updates database with progress and results
6. **Server** provides real-time status via WebSocket/SSE

### Error Handling & Retry Logic

- **Activity Retries**: Configurable retry policies for transient failures
- **Workflow Timeouts**: Reasonable timeouts for long-running operations
- **Compensation**: Rollback activities for failed infrastructure provisioning
- **Dead Letter Queues**: Handle permanently failed workflows

## Database Integration

### Shared Models

Workers will reuse existing GORM models from `internal/model/`:
- Applications, Environments, Clusters
- Variables, Manifests, Revisions  
- IaC Components (future - needs implementation)

### Workflow State Tracking

**Option 1 - Database State Storage:**
Store workflow execution state in new table:

```sql
-- Migration: Add to cmd/server/migrations/
CREATE TABLE workflow_executions (
    id UUID PRIMARY KEY,
    workflow_id VARCHAR NOT NULL,
    run_id VARCHAR NOT NULL,
    workflow_type VARCHAR NOT NULL,
    environment_id UUID REFERENCES environments(id),
    status VARCHAR NOT NULL,
    input JSONB,
    result JSONB,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_workflow_executions_environment ON workflow_executions(environment_id);
CREATE INDEX idx_workflow_executions_status ON workflow_executions(status);
```

**Option 2 - Temporal Native State (Recommended):**
- Use Temporal's built-in workflow state management
- Query workflow status via Temporal client APIs
- Simpler implementation, no additional database tables needed

**Implementation Notes:**
- Workers use same database connection pool as server
- Shared connection configuration from `internal/config/database.go`
- Reuse existing database service from `internal/service/database/`

## Security Considerations

### Credential Management
- **Terraform State**: Secure backend configuration (S3/GCS)
- **Cloud Credentials**: Environment variables or secret management
- **Database Access**: Shared connection pooling with server

### Network Security
- **Temporal Connection**: TLS encryption for production
- **Database Access**: Connection string encryption
- **API Access**: Internal service-to-service authentication

## Monitoring & Observability

### Metrics
- **Workflow Execution**: Success/failure rates, duration
- **Activity Performance**: Terraform execution times, template processing
- **Resource Usage**: Memory, CPU utilization during operations

### Logging  
- **Structured Logging**: Zap logger with workflow context
- **Correlation IDs**: Trace workflows across server and worker
- **Error Tracking**: Detailed error logs for debugging

### Health Checks
- **Worker Health**: Temporal connection status
- **Activity Health**: Database connectivity, external service availability

## Testing Strategy

### Unit Tests
- **Workflow Logic**: Test workflow definitions with mock activities
- **Activity Implementation**: Test individual activities with mocked dependencies
- **Integration Points**: Test Temporal client integration

### Integration Tests
- **End-to-End**: Full workflow execution with test Temporal server
- **Database**: Test workflow state persistence
- **External Services**: Mock Terraform and Kubernetes APIs

## Deployment Considerations

### Container Strategy
- **Single Image**: Multi-stage build with both binaries
- **Process Selection**: Container command determines server vs worker
- **Resource Allocation**: Separate resource limits for each process

### Scaling
- **Horizontal Scaling**: Multiple worker instances for high throughput
- **Task Queue Partitioning**: Separate queues for different workflow types
- **Load Balancing**: Temporal handles worker load distribution

## Implementation Tasks & Order

### Phase 1: Foundation (Sprint 1)
**Goal**: Basic worker process structure and development workflow

**Tasks:**
1. **Setup Command Structure**
   - [ ] Copy `cmd/server/` to `cmd/worker/` as template
   - [ ] Create `cmd/worker/main.go` for separate binary approach
   - [ ] Update worker root command to use `admiral-worker` name
   - [ ] Reuse existing config loading patterns

2. **Development Tooling**
   - [ ] Add worker targets to `Makefile` (worker, worker-dev, worker-test)
   - [ ] Create `cmd/worker/.air.toml` for hot reload
   - [ ] Update docker-compose.yaml to include worker service
   - [ ] Test basic worker binary builds and runs

3. **Basic Workflow Registry**
   - [ ] Create `internal/workflow/registry.go` structure
   - [ ] Implement worker registration with Temporal task queues
   - [ ] Add basic health check workflow for testing

**Definition of Done**: Worker binary builds, starts, and connects to Temporal

### Phase 2: Core Workflows (Sprint 2-3)  
**Goal**: Infrastructure provisioning and deployment workflows

**Tasks:**
1. **Infrastructure Workflow**
   - [ ] Implement DAG resolution activity (reuse existing `internal/dag/`)
   - [ ] Create Terraform execution activity
   - [ ] Build variable injection and output capture
   - [ ] Add rollback/compensation logic

2. **Deployment Workflow**  
   - [ ] Template processing activity (reuse existing template service)
   - [ ] Manifest generation and validation
   - [ ] Revision creation activity
   - [ ] Controller notification activity

3. **Integration Points**
   - [ ] Server workflow submission endpoints
   - [ ] Real-time status updates (WebSocket/SSE)
   - [ ] Database state management (choose Option 1 or 2)

**Definition of Done**: End-to-end infrastructure provisioning and deployment via workflows

### Phase 3: Production Features (Sprint 4)
**Goal**: Production-ready reliability and observability

**Tasks:**
1. **Error Handling & Resilience**
   - [ ] Configure retry policies for activities
   - [ ] Implement circuit breakers for external services
   - [ ] Add dead letter queue handling
   - [ ] Comprehensive error logging and alerting

2. **Monitoring & Observability**
   - [ ] Metrics collection (workflow duration, success rates)
   - [ ] Distributed tracing integration
   - [ ] Health check endpoints
   - [ ] Dashboard integration for workflow status

3. **Testing & Quality**
   - [ ] Unit tests for workflows and activities
   - [ ] Integration tests with test Temporal server
   - [ ] Load testing for concurrent workflows
   - [ ] Documentation and runbooks

**Definition of Done**: Production deployment ready with full observability

### Phase 4: Advanced Features (Future)
**Goal**: Advanced workflow capabilities

**Tasks:**
1. **Workflow Versioning**
   - [ ] Workflow definition versioning strategy
   - [ ] Migration path for workflow updates
   - [ ] Backward compatibility handling

2. **Performance & Scaling**
   - [ ] Worker auto-scaling based on queue depth
   - [ ] Batch processing for multiple environments
   - [ ] Workflow execution optimization

3. **External Integrations**
   - [ ] CI/CD pipeline integration
   - [ ] External approval workflows
   - [ ] Notification system integration

**Definition of Done**: Advanced workflow features for enterprise deployment

## Key Files to Reference During Implementation

### Existing Patterns to Follow
- **Command Structure**: `cmd/server/root.go` - Follow same pattern for worker root command
- **Configuration**: `internal/config/config.go` - Add Worker config struct here
- **Service Registration**: `internal/service/service.go` - Pattern for registering services
- **Temporal Client**: `internal/service/temporal/temporal.go` - Existing client implementation to extend
- **Database Models**: `internal/model/*.go` - Reuse existing models for workflow data
- **Build System**: `Makefile` - Follow existing patterns for worker targets

### New Files to Create
- `cmd/worker/main.go` - Worker binary entry point
- `cmd/worker/root.go` - Worker command structure (copy from server)
- `cmd/worker/start.go` - Worker start command with Temporal registration
- `cmd/worker/.air.toml` - Hot reload config (copy from server pattern)
- `internal/workflow/registry.go` - Workflow and activity registration
- `internal/workflow/infrastructure/` - Infrastructure provisioning workflows
- `internal/workflow/deployment/` - Deployment workflows

### Configuration Examples

**Add to config.yaml:**
```yaml
worker:
  task_queues:
    - infrastructure  
    - deployment
  max_concurrent_activities: 10
  max_concurrent_workflows: 5
  namespace: "default"
```

**Add to internal/config/config.go:**
```go
type Worker struct {
    TaskQueues               []string `yaml:"task_queues"`
    MaxConcurrentActivities  int      `yaml:"max_concurrent_activities"`
    MaxConcurrentWorkflows   int      `yaml:"max_concurrent_workflows"`
    Namespace                string   `yaml:"namespace"`
}
```

## Implementation Checklist

### Before Starting
- [ ] Review existing Temporal service implementation
- [ ] Understand current DAG resolution in `internal/dag/`
- [ ] Review template processing system
- [ ] Check docker-compose setup for Temporal server

### Critical Dependencies  
- **Temporal Server**: Must be running (docker-compose provides this)
- **Database**: Same PostgreSQL instance as server
- **Configuration**: Shared config.yaml file
- **Logging**: Reuse existing zap logger setup

### Testing Strategy
1. **Unit Tests**: Mock Temporal activities, test workflow logic
2. **Integration Tests**: Use test Temporal server instance
3. **End-to-End Tests**: Full workflow execution with real dependencies
4. **Load Tests**: Multiple concurrent workflows for performance validation

## Related Documentation

- [Temporal Go SDK Documentation](https://docs.temporal.io/docs/go/)
- [Admiral Development Setup](dev-setup.md)
- [Admiral Release Process](release.md)  
- [CLAUDE.md - Workflow & Execution](../CLAUDE.md#workflow--execution)
- [CLAUDE.md - Variable Management](../CLAUDE.md#variable-management--processing-pipeline)
