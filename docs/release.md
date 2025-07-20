# Release Process

This document describes the release process for Admiral, which uses semantic versioning and automated releases via GoReleaser.

## Overview

Admiral uses a tag-based release process where creating a version tag triggers the automated release pipeline. The process involves:

1. **Manual Tag Creation**: Create and push a semantic version tag
2. **Automated Release**: GitHub Actions runs GoReleaser to build and publish the release
3. **Artifact Publishing**: Binaries, Docker images, and documentation are published automatically

## Prerequisites

Before creating a release, ensure:

- [ ] All desired changes are merged to `master` branch
- [ ] CI tests are passing on `master`
- [ ] You have push access to the repository
- [ ] You have `svu` installed locally for version calculation (optional but recommended)

### Installing svu

```bash
# macOS
brew install caarlos0/tap/svu

# Linux/Manual installation
curl -sfL https://install.goreleaser.com/github.com/caarlos0/svu.sh | sh
```

## Release Steps

### Step 1: Determine Next Version

Use `svu` to calculate the next semantic version based on conventional commits:

```bash
# Check what the next version would be
svu next

# Check what the next patch version would be
svu next --patch

# Check what the next minor version would be  
svu next --minor

# Check what the next major version would be
svu next --major
```

**Commit Message Conventions:**
- `feat:` → Minor version bump
- `fix:` → Patch version bump  
- `feat!:` or `fix!:` → Major version bump (breaking change)
- `chore:`, `docs:`, `test:` → No version bump

### Step 2: Create and Push Tag

```bash
# Get the next version (example output: v1.2.3)
NEXT_VERSION=$(svu next)

# Create and push the tag
git tag $NEXT_VERSION
git push origin $NEXT_VERSION
```

**Alternative: Manual versioning**
```bash
# Create tag manually (replace with desired version)
git tag v1.2.3
git push origin v1.2.3
```

### Step 3: Monitor Release

1. Go to [GitHub Actions](https://github.com/mberwanger/admiral/actions)
2. Watch the "Release" workflow run
3. Verify the release appears in [GitHub Releases](https://github.com/mberwanger/admiral/releases)

## What Gets Published

When a tag is pushed, the automated release process creates:

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

## Configuration Files

- **`.goreleaser.yaml`**: GoReleaser configuration
- **`.github/workflows/release.yaml`**: GitHub Actions workflow
- **`.github/workflows/ci.yaml`**: CI workflow for testing

## Troubleshooting

### Release Failed

1. Check the [GitHub Actions logs](https://github.com/mberwanger/admiral/actions)
2. Common issues:
   - Build failures (check `make web` and `make server-with-assets`)
   - Permission issues (check `GH_PAT` secret)
   - Docker build failures (check Dockerfile)

### Re-running a Release

If a release fails:

```bash
# Delete the tag locally and remotely
git tag -d v1.2.3
git push origin :refs/tags/v1.2.3

# Fix the issue, then recreate the tag
git tag v1.2.3
git push origin v1.2.3
```

### Manual Release

To create a snapshot release without tagging:

```bash
# Install GoReleaser
brew install goreleaser

# Create snapshot release
goreleaser release --snapshot --clean
```

## Version Strategy

Admiral follows [Semantic Versioning](https://semver.org/):

- **MAJOR** (`v2.0.0`): Breaking changes
- **MINOR** (`v1.1.0`): New features, backward compatible
- **PATCH** (`v1.0.1`): Bug fixes, backward compatible

Use conventional commits to ensure proper automatic versioning:

```bash
# Patch release
git commit -m "fix: resolve authentication timeout issue"

# Minor release  
git commit -m "feat: add cluster health monitoring"

# Major release
git commit -m "feat!: redesign API authentication system"
```

## Support

For questions about the release process:

1. Check the [GitHub Actions documentation](https://docs.github.com/en/actions)
2. Review [GoReleaser documentation](https://goreleaser.com/)
3. Open an issue in this repository
