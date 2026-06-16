# @nself/native-bridge — Android CMakeLists.txt
#
# Purpose: Link nclaw-jni.cpp against the pre-built libnclaw static library
#          to produce libnclaw-bridge.so loaded by NclawModule.kt at runtime.
#
# Inputs:  android/src/main/cpp/nclaw-jni.cpp (JNI bridge)
#          android/libs/${ANDROID_ABI}/libnclaw.a (Rust static lib — built by scripts/build.sh)
#          android/libs/nclaw.h (cbindgen-generated — built by scripts/build.sh)
#
# Outputs: libnclaw-bridge.so (JNI shared library, linked into the APK)
#
# Build: invoked by Gradle via externalNativeBuild in build.gradle.kts.
# ABI: arm64-v8a primary (aarch64-linux-android); x86_64 for emulator.
#
# Cross-ref: T-P3-E4-W2-S3-T03 (this ticket)
#            scripts/build.sh (cross-compile script producing libnclaw.a)

cmake_minimum_required(VERSION 3.22.1)
project("nclaw-bridge" CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Include cbindgen-generated C header for nclaw/core.
include_directories(${CMAKE_CURRENT_SOURCE_DIR}/../libs)

# Pre-built libnclaw static library (per ABI — built by scripts/build.sh).
add_library(nclaw STATIC IMPORTED)
set_target_properties(nclaw PROPERTIES
    IMPORTED_LOCATION
    "${CMAKE_CURRENT_SOURCE_DIR}/../libs/${ANDROID_ABI}/libnclaw.a"
)

# JNI shared library: nclaw-jni.cpp → libnclaw-bridge.so
add_library(
    nclaw-bridge
    SHARED
    src/main/cpp/nclaw-jni.cpp
)

# Link against: pre-built libnclaw, Android log, and C++ stdlib.
target_link_libraries(
    nclaw-bridge
    nclaw
    android
    log
    c++_shared
)
