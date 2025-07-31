#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="${REPO_ROOT:-"$(realpath "$(dirname "${BASH_SOURCE[0]}")/..")"}"
BUILD_ROOT="${REPO_ROOT}/build"
BUILD_BIN="${BUILD_ROOT}/bin"

NAME=bun
RELEASE=1.2.19
OSX_X64_RELEASE_SHA256=dfd7e4c47311b5dbd38230b3cfd357f5d0beae8ef979962c5b41008fc41c25a0
OSX_AARCH64_RELEASE_SHA256=674a48378342efaadc3c291596b573010f3c2388958f7c44678d87f6fb759991
LINUX_RELEASE_SHA256=c3d3c14e9a5ec83ff67d0acfe76e4315ad06da9f34f59fc7b13813782caf1f66

ARCH=x64

RELEASE_BINARY="${BUILD_BIN}/${NAME}-${RELEASE}"

main() {
  ensure_binary

  "${RELEASE_BINARY}" "$@"
}

ensure_binary() {
  if [[ ! -f "${RELEASE_BINARY}" ]]; then
    echo "info: Downloading ${NAME} ${RELEASE} to build environment"
    mkdir -p "${BUILD_BIN}"

    case "${OSTYPE}" in
      "darwin"*)
        os_type="darwin"
        if [[ "$(uname -m)" == "arm64" ]]; then
          ARCH="aarch64"
          sum="${OSX_AARCH64_RELEASE_SHA256}"
        else
          sum="${OSX_X64_RELEASE_SHA256}"
        fi
        ;;
      "linux"*)
        os_type="linux"
        sum="${LINUX_RELEASE_SHA256}"
        ;;
      *) echo "error: Unsupported OS '${OSTYPE}' for ${NAME} install, please install manually" && exit 1 ;;
    esac

    release_archive="/tmp/${NAME}-${RELEASE}.zip"
    URL="https://github.com/oven-sh/bun/releases/download/bun-v${RELEASE}/bun-${os_type}-${ARCH}.zip"
    curl -sSL -o "${release_archive}" "${URL}"
    echo "${sum}  ${release_archive}" | sha256sum --check --quiet -

    release_tmp_dir="/tmp/${NAME}-${RELEASE}"
    mkdir -p "${release_tmp_dir}"
    unzip -q "${release_archive}" -d "${release_tmp_dir}"

    find "${BUILD_BIN}" -maxdepth 1 -regex '.*/'${NAME}'-[0-9\.]+$' -exec rm {} \;  # cleanup older versions
    mv "${release_tmp_dir}/bun-${os_type}-${ARCH}/bun" "${RELEASE_BINARY}"
    chmod +x "${RELEASE_BINARY}"

    # Cleanup
    rm -rf "${release_archive}" "${release_tmp_dir}"
  fi
}

main "$@"
