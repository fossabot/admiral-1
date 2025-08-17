# Third Party Licenses

This document provides detailed information about the third-party dependencies used in Admiral and their respective licenses.

## License Summary

Admiral is licensed under the Apache License 2.0. The project uses various third-party dependencies with compatible licenses:

- **Apache 2.0**: Most dependencies including core OpenTelemetry libraries
- **MPL-2.0**: Go MySQL Driver, HashiCorp libraries (errwrap, go-multierror), and OpenTelemetry Go Automatic Instrumentation (weak copyleft, compatible with Apache 2.0)
- **MIT**: Various Go and JavaScript dependencies
- **BSD**: Some utility libraries

## MPL-2.0 Licensed Components

### Go MySQL Driver

- **Package**: `github.com/go-sql-driver/mysql`
- **Version**: v1.9.3
- **License**: Mozilla Public License 2.0 (MPL-2.0)
- **Repository**: https://github.com/go-sql-driver/mysql
- **License URL**: https://mozilla.org/MPL/2.0/
- **Usage**: Database driver for MySQL connections

### HashiCorp errwrap

- **Package**: `github.com/hashicorp/errwrap`
- **Version**: v1.1.0
- **License**: Mozilla Public License 2.0 (MPL-2.0)
- **Repository**: https://github.com/hashicorp/errwrap
- **License URL**: https://mozilla.org/MPL/2.0/
- **Usage**: Go library for wrapping and containing errors

### HashiCorp go-multierror

- **Package**: `github.com/hashicorp/go-multierror`
- **Version**: v1.1.1
- **License**: Mozilla Public License 2.0 (MPL-2.0)
- **Repository**: https://github.com/hashicorp/go-multierror
- **License URL**: https://mozilla.org/MPL/2.0/
- **Usage**: Go package for combining multiple errors into a single error

### OpenTelemetry Go Automatic Instrumentation

- **Package**: `go.opentelemetry.io/auto/sdk`
- **Version**: v1.1.0
- **License**: Mozilla Public License 2.0 (MPL-2.0)
- **Repository**: https://github.com/open-telemetry/opentelemetry-go-instrumentation
- **License URL**: https://mozilla.org/MPL/2.0/
- **Usage**: Automatic instrumentation for observability

**Important Note about MPL-2.0**:
The Mozilla Public License 2.0 is a weak copyleft license that:
- Only requires changes to MPL-licensed files to be shared
- Does not affect the license of other files in the project
- Allows static linking without license propagation
- Is compatible with Apache 2.0 for this usage

## Apache 2.0 Licensed Components

### Core OpenTelemetry Libraries

- `go.opentelemetry.io/otel` - v1.37.0
- `go.opentelemetry.io/otel/metric` - v1.37.0
- `go.opentelemetry.io/otel/sdk` - v1.37.0
- `go.opentelemetry.io/otel/trace` - v1.37.0
- `go.opentelemetry.io/contrib/instrumentation/google.golang.org/grpc/otelgrpc` - v0.62.0
- `go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp` - v0.62.0

### Google Cloud Platform OpenTelemetry

- `github.com/GoogleCloudPlatform/opentelemetry-operations-go/detectors/gcp` - v1.29.0
- `github.com/GoogleCloudPlatform/opentelemetry-operations-go/exporter/metric` - v0.53.0

## License Compatibility Matrix

| Dependency License | Compatible with Apache 2.0 | Notes |
|-------------------|---------------------------|--------|
| Apache 2.0 | ✅ Yes | Same license |
| MIT | ✅ Yes | Permissive, no restrictions |
| BSD (2/3-clause) | ✅ Yes | Permissive, attribution required |
| MPL-2.0 | ✅ Yes | Weak copyleft, file-level only |
| ISC | ✅ Yes | Permissive, similar to MIT |

## Compliance Requirements

### For MPL-2.0 Dependencies

1. **Attribution**: Include copyright notice and license (✅ Done in NOTICE file)
2. **Source Availability**: If modifying MPL files, make modifications available
3. **License Preservation**: Keep MPL license headers in MPL-licensed files

### For Apache 2.0 Dependencies

1. **Attribution**: Include copyright notice and license
2. **NOTICE Preservation**: Include contents of NOTICE files if present
3. **State Changes**: Document significant modifications

### For MIT/BSD Dependencies

1. **Attribution**: Include copyright notice and license text
2. **Disclaimer**: Preserve warranty disclaimers

## Dependency Management

To view all current dependencies and their licenses:

```bash
# For Go dependencies
go list -m all | while read -r mod ver; do
  echo "$mod $ver"
  go mod download -json "$mod@$ver" 2>/dev/null | jq -r '.Dir' | xargs -I {} find {} -name "LICENSE*" -o -name "COPYING*" 2>/dev/null | head -1
done

# For JavaScript dependencies (in web/ directory)
cd web && bun licenses list
```

## Updates and Maintenance

This document should be updated when:
- Adding new dependencies with different licenses
- Upgrading dependencies that change license terms
- Removing significant dependencies

Last updated: January 2025

## Questions or Concerns

For questions about license compatibility or compliance, please consult with legal counsel or open an issue in the project repository.
