#!/usr/bin/env bash
# Build a Play-uploadable Android App Bundle. Requires a local upload keystore.
set -euo pipefail
cd "$(dirname "$0")"

if [[ ! -f keystore.properties ]]; then
  echo "Missing keystore.properties."
  echo "Copy keystore.properties.example, create upload-keystore.jks with keytool,"
  echo "and fill in the passwords. Do not commit those files."
  exit 1
fi

if [[ -z "${ANDROID_HOME:-}${ANDROID_SDK_ROOT:-}" && ! -f local.properties ]]; then
  echo "Set ANDROID_HOME or create local.properties with sdk.dir=..."
  exit 1
fi

./gradlew bundleRelease
echo
echo "Upload this file to Play Console (Closed testing):"
echo "  $(pwd)/app/build/outputs/bundle/release/app-release.aab"
