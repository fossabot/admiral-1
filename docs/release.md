# Release Process

This document describes the release process for Admiral, which uses semantic versioning and automated releases via GoReleaser.

## Overview

Admiral uses a tag-based release process where creating a version tag triggers the automated release pipeline. The process involves:

1. **Tag Creation**: Create a semantic version tag (manually via GitHub Actions or locally)
2. **Automated Release**: GitHub Actions runs GoReleaser to build and publish the release
3. **Artifact Publishing**: Binaries, Docker images, and documentation are published automatically

## Prerequisites

Before creating a release, ensure:

- [ ] All desired changes are merged to `master` branch
- [ ] CI tests are passing on `master`
- [ ] You have appropriate permissions for releases (see environment protection)

## Release Methods

### Method 1: Manual Release Workflow (Recommended)

The preferred method uses GitHub's manual workflow with automatic version calculation:

#### Steps

1. **Navigate to Actions**
   - Go to [GitHub Actions](https://github.com/mberwanger/admiral/actions)
   - Select "Manual Release" workflow

2. **Configure Release**
   - Select version type:
     - `next` - Auto-determine based on commits (recommended)
     - `patch` - Bug fixes and small changes  
     - `minor` - New features, backward compatible
     - `major` - Breaking changes
   - Click "Run workflow"

3. **Monitor Progress**
   - The workflow calculates the version using `svu`
   - Creates and pushes the tag automatically
   - Triggers the automatic release pipeline
   - Monitor progress in the Actions tab

#### Advantages

- ✅ **Automatic version calculation** using conventional commits
- ✅ **Access control** via environment protection rules
- ✅ **Audit trail** in GitHub Actions
- ✅ **No local setup required**
- ✅ **Prevents duplicate tags**

### Method 2: Local Tag Creation

Alternative method for local development or when manual workflow is unavailable:

#### Prerequisites

Install `svu` for version calculation:

```bash
# macOS
brew install caarlos0/tap/svu

# Linux/Manual installation
curl -sfL https://install.goreleaser.com/github.com/caarlos0/svu.sh | sh
```

#### Steps

1. **Calculate Next Version**
   ```bash
   # Auto-determine next version
   svu next

   # Or specify version type
   svu next --patch   # Bug fixes
   svu next --minor   # New features  
   svu next --major   # Breaking changes
   ```

2. **Create and Push Tag**
   ```bash
   # Get the next version (example output: v1.2.3)
   NEXT_VERSION=$(svu next)

   # Create and push the tag
   git tag $NEXT_VERSION
   git push origin $NEXT_VERSION
   ```

3. **Monitor Release**
   - Go to [GitHub Actions](https://github.com/mberwanger/admiral/actions)
   - Watch the "Release" workflow run
   - Verify the release appears in [GitHub Releases](https://github.com/mberwanger/admiral/releases)

## Version Strategy & Conventional Commits

Admiral follows [Semantic Versioning](https://semver.org/) with automatic calculation based on conventional commits:

### Commit Message Conventions

- `feat:` → Minor version bump (new features)
- `fix:` → Patch version bump (bug fixes)  
- `feat!:` or `fix!:` → Major version bump (breaking changes)
- `chore:`, `docs:`, `test:`, `ci:` → No version bump

### Examples

```bash
# Patch release (v1.0.1)
git commit -m "fix: resolve authentication timeout issue"

# Minor release (v1.1.0)
git commit -m "feat: add cluster health monitoring"

# Major release (v2.0.0)
git commit -m "feat!: redesign API authentication system"
```

### Version Types

- **MAJOR** (`v2.0.0`): Breaking changes, incompatible API changes
- **MINOR** (`v1.1.0`): New features, backward compatible additions
- **PATCH** (`v1.0.1`): Bug fixes, backward compatible changes

## What Gets Published

When a tag is created (via either method), the automated release process creates:

### 🏗️ **Binary Artifacts**
- Cross-platform binaries (Linux, macOS, Windows)
- Multiple architectures (386, amd64, arm, arm64)
- Compressed archives with checksums
- Software Bill of Materials (SBOM)

### 🐳 **Docker Images**
- Multi-architecture images (amd64, arm64)
- Published to `ghcr.io/mberwanger/admiral-server`
- Tagged with:
  - `v1.2.3` (exact version)
  - `v1.2` (minor version)
  - `v1` (major version)
  - `latest`

### 📝 **Release Notes**
- Auto-generated changelog from commit messages
- Grouped by feature type (features, fixes, security, etc.)
- Download links for all artifacts

### 🔐 **Security Attestations**
- Build provenance attestations
- Signed with Sigstore/Cosign

## Release Workflow Details

The release is triggered by the `.github/workflows/release.yaml` workflow which:

1. **Builds Frontend**: Runs `make web` to build React assets
2. **Embeds Assets**: Generates Go embed files for web assets
3. **Cross-Compilation**: Builds binaries for all supported platforms
4. **Docker Images**: Creates multi-arch container images
5. **Publishing**: Uploads to GitHub Releases and Container Registry
6. **Security**: Generates and signs attestations

## Access Control

The manual release workflow uses environment protection:

- **Environment**: `release`
- **Required reviewers**: Configured in repository settings
- **Branch restrictions**: Only `master` branch allowed

To configure:
1. Go to **Settings** → **Environments**
2. Create/edit `release` environment
3. Add required reviewers or deployment protection rules

## Configuration Files

- **`.goreleaser.yaml`**: GoReleaser configuration
- **`.github/workflows/release.yaml`**: Automatic release workflow
- **`.github/workflows/manual-release.yaml`**: Manual release workflow
- **`.github/workflows/ci.yaml`**: CI workflow for testing

## Troubleshooting

### Release Failed

1. Check the [GitHub Actions logs](https://github.com/mberwanger/admiral/actions)
2. Common issues:
   - Build failures (check `make web` and `make server-with-assets`)
   - Permission issues (check `GH_PAT` secret)
   - Docker build failures (check Dockerfile)
   - Environment protection blocking release

### Tag Already Exists

If you get a "tag already exists" error:

```bash
# Delete the tag locally and remotely
git tag -d v1.2.3
git push origin :refs/tags/v1.2.3

# Then retry the release process
```

### Re-running a Failed Release

If a release workflow fails but the tag was created:

1. **Via Manual Workflow**: Re-run the failed workflow in Actions
2. **Via Local**: Delete and recreate the tag as shown above

### Snapshot Release (Development)

To create a local snapshot release without tagging:

```bash
# Install GoReleaser
brew install goreleaser

# Create snapshot release
goreleaser release --snapshot --clean
```

This creates artifacts in `./build/` without publishing or creating tags.

## Support

For questions about the release process:

1. Check the [GitHub Actions documentation](https://docs.github.com/en/actions)
2. Review [GoReleaser documentation](https://goreleaser.com/)
3. Review [svu documentation](https://github.com/caarlos0/svu)
4. Open an issue in this repository
