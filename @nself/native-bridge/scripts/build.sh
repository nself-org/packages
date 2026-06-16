#!/usr/bin/env bash
# @nself/native-bridge — Rust cross-compile + cbindgen header generation script.
#
# Purpose: Build libnclaw static library for iOS and Android from nclaw/core.
#          Generate nclaw.h C header via cbindgen for use in NclawModule.mm/.cpp.
#
# Inputs:  nclaw/core/Cargo.toml (Rust crate to compile)
#          nclaw/core/cbindgen.toml (cbindgen configuration)
#
# Outputs:
#   ios/libs/libnclaw.a          — fat static lib (aarch64-apple-ios + sim)
#   ios/libs/nclaw.h             — cbindgen C header
#   android/libs/arm64-v8a/libnclaw.a   — Android arm64 static lib
#   android/libs/x86_64/libnclaw.a      — Android x86_64 (emulator) static lib
#   android/libs/nclaw.h         — cbindgen C header (same as iOS)
#
# Prerequisites:
#   rustup target add aarch64-apple-ios aarch64-apple-ios-sim x86_64-apple-ios
#   rustup target add aarch64-linux-android x86_64-linux-android
#   cargo install cargo-ndk cbindgen
#   Android NDK installed; ANDROID_NDK_HOME set.
#
# Usage (from packages/native-bridge/):
#   ./scripts/build.sh
#   ./scripts/build.sh --ios-only
#   ./scripts/build.sh --android-only
#   ./scripts/build.sh --release      (default; use --debug for debug builds)
#
# Cross-ref: T-P3-E4-W2-S3-T03 (this ticket)
#            nclaw/core/Cargo.toml (crate: libnclaw, crate-type: ["staticlib"])
#            nclaw/core/cbindgen.toml (cbindgen configuration)

set -euo pipefail

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PACKAGE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
NCLAW_CORE_DIR="$(cd "$PACKAGE_DIR/../../nclaw/core" && pwd)"

IOS_LIBS_DIR="$PACKAGE_DIR/ios/libs"
ANDROID_LIBS_DIR="$PACKAGE_DIR/android/libs"

PROFILE="${BUILD_PROFILE:-release}"
BUILD_IOS=true
BUILD_ANDROID=true

for arg in "$@"; do
  case "$arg" in
    --ios-only)      BUILD_ANDROID=false ;;
    --android-only)  BUILD_IOS=false ;;
    --debug)         PROFILE=debug ;;
    --release)       PROFILE=release ;;
  esac
done

echo "=== @nself/native-bridge build.sh ==="
echo "  nclaw/core:  $NCLAW_CORE_DIR"
echo "  profile:     $PROFILE"
echo "  iOS:         $BUILD_IOS"
echo "  Android:     $BUILD_ANDROID"
echo ""

# ---------------------------------------------------------------------------
# Check prerequisites
# ---------------------------------------------------------------------------

command -v cbindgen >/dev/null 2>&1 || {
  echo "ERROR: cbindgen not found. Install: cargo install cbindgen"
  exit 1
}

if [ "$BUILD_ANDROID" = true ]; then
  command -v cargo-ndk >/dev/null 2>&1 || {
    echo "ERROR: cargo-ndk not found. Install: cargo install cargo-ndk"
    exit 1
  }
  if [ -z "${ANDROID_NDK_HOME:-}" ]; then
    echo "ERROR: ANDROID_NDK_HOME not set. Install Android NDK and set the env var."
    exit 1
  fi
fi

# ---------------------------------------------------------------------------
# Step 1: Generate cbindgen C header
# ---------------------------------------------------------------------------

echo "--- [1/5] Generating nclaw.h via cbindgen ---"

mkdir -p "$IOS_LIBS_DIR"
mkdir -p "$ANDROID_LIBS_DIR"

# cbindgen reads nclaw/core/cbindgen.toml and outputs a C-compatible header.
# All #[no_mangle] functions + #[repr(C)] structs are included.
(cd "$NCLAW_CORE_DIR" && cbindgen \
  --config cbindgen.toml \
  --output "$IOS_LIBS_DIR/nclaw.h" \
  --lang c \
  --quiet)

# Copy to Android libs for nclaw-jni.cpp include.
cp "$IOS_LIBS_DIR/nclaw.h" "$ANDROID_LIBS_DIR/nclaw.h"

echo "  → $IOS_LIBS_DIR/nclaw.h"
echo "  → $ANDROID_LIBS_DIR/nclaw.h"

# Verify all expected FFI symbols are present in the header.
EXPECTED_SYMBOLS=(
  "libnclaw_last_error"
  "libnclaw_version"
  "libnclaw_free_string"
  "libnclaw_keypair_generate"
  "libnclaw_keypair_public_b64"
  "libnclaw_keypair_free"
  "libnclaw_keypair_dh"
  "libnclaw_cipher_encrypt"
  "libnclaw_cipher_decrypt"
  "libnclaw_cipher_free"
  "nclaw_set_low_power"
  "nclaw_set_battery_pct"
  "nclaw_set_thermal_level"
)

missing=0
for sym in "${EXPECTED_SYMBOLS[@]}"; do
  if ! grep -q "$sym" "$IOS_LIBS_DIR/nclaw.h"; then
    echo "  ERROR: Missing symbol in nclaw.h: $sym"
    missing=$((missing + 1))
  fi
done

if [ $missing -gt 0 ]; then
  echo "ERROR: $missing FFI symbols missing from nclaw.h. Check nclaw/core/src/lib.rs."
  exit 1
fi
echo "  ✓ All 13 required FFI symbols present in nclaw.h"

# ---------------------------------------------------------------------------
# Step 2: Build for iOS
# ---------------------------------------------------------------------------

if [ "$BUILD_IOS" = true ]; then
  echo ""
  echo "--- [2/5] Building libnclaw for iOS (aarch64-apple-ios) ---"
  (cd "$NCLAW_CORE_DIR" && cargo build \
    --"$PROFILE" \
    --target aarch64-apple-ios \
    2>&1)

  echo "--- [3/5] Building libnclaw for iOS Simulator (aarch64-apple-ios-sim) ---"
  (cd "$NCLAW_CORE_DIR" && cargo build \
    --"$PROFILE" \
    --target aarch64-apple-ios-sim \
    2>&1)

  # Create fat library combining device + sim for development (lipo).
  DEVICE_LIB="$NCLAW_CORE_DIR/target/aarch64-apple-ios/$PROFILE/libnclaw.a"
  SIM_LIB="$NCLAW_CORE_DIR/target/aarch64-apple-ios-sim/$PROFILE/libnclaw.a"
  FAT_LIB="$IOS_LIBS_DIR/libnclaw.a"

  if command -v lipo >/dev/null 2>&1; then
    lipo -create "$DEVICE_LIB" "$SIM_LIB" -output "$FAT_LIB"
    echo "  → fat library (device + sim): $FAT_LIB"
  else
    # Fallback: use device-only lib on Linux CI (no lipo).
    cp "$DEVICE_LIB" "$FAT_LIB"
    echo "  → device-only library (lipo not found): $FAT_LIB"
  fi

  # Verify nm shows all expected symbols in the output library.
  echo "  Verifying symbols in libnclaw.a..."
  missing_lib=0
  for sym in "${EXPECTED_SYMBOLS[@]}"; do
    if ! nm "$FAT_LIB" 2>/dev/null | grep -q "$sym"; then
      echo "  WARNING: Symbol not found in libnclaw.a: $sym"
      missing_lib=$((missing_lib + 1))
    fi
  done
  if [ $missing_lib -eq 0 ]; then
    echo "  ✓ All 13 symbols confirmed present in libnclaw.a (nm check)"
  fi
fi

# ---------------------------------------------------------------------------
# Step 3: Build for Android
# ---------------------------------------------------------------------------

if [ "$BUILD_ANDROID" = true ]; then
  echo ""
  echo "--- [4/5] Building libnclaw for Android arm64-v8a (aarch64-linux-android) ---"
  mkdir -p "$ANDROID_LIBS_DIR/arm64-v8a"
  (cd "$NCLAW_CORE_DIR" && cargo ndk \
    --target aarch64-linux-android \
    --platform 24 \
    build --"$PROFILE" \
    2>&1)
  cp "$NCLAW_CORE_DIR/target/aarch64-linux-android/$PROFILE/libnclaw.a" \
     "$ANDROID_LIBS_DIR/arm64-v8a/libnclaw.a"
  echo "  → $ANDROID_LIBS_DIR/arm64-v8a/libnclaw.a"

  echo "--- [5/5] Building libnclaw for Android x86_64 (emulator) ---"
  mkdir -p "$ANDROID_LIBS_DIR/x86_64"
  (cd "$NCLAW_CORE_DIR" && cargo ndk \
    --target x86_64-linux-android \
    --platform 24 \
    build --"$PROFILE" \
    2>&1)
  cp "$NCLAW_CORE_DIR/target/x86_64-linux-android/$PROFILE/libnclaw.a" \
     "$ANDROID_LIBS_DIR/x86_64/libnclaw.a"
  echo "  → $ANDROID_LIBS_DIR/x86_64/libnclaw.a"

  # Verify Android symbols.
  echo "  Verifying symbols in Android arm64 libnclaw.a..."
  missing_android=0
  for sym in "${EXPECTED_SYMBOLS[@]}"; do
    if ! nm "$ANDROID_LIBS_DIR/arm64-v8a/libnclaw.a" 2>/dev/null | grep -q "$sym"; then
      echo "  WARNING: Symbol not found in Android libnclaw.a: $sym"
      missing_android=$((missing_android + 1))
    fi
  done
  if [ $missing_android -eq 0 ]; then
    echo "  ✓ All 13 symbols confirmed present in Android libnclaw.a (nm check)"
  fi
fi

echo ""
echo "=== build.sh complete ==="
echo ""
echo "Next steps:"
echo "  iOS:     cd nclaw/mobile && pod install (Podfile references NclawModule.podspec)"
echo "  Android: cd nclaw/mobile/android && ./gradlew assembleRelease"
