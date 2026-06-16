# @nself/native-bridge — NclawModule CocoaPods podspec
#
# Purpose: Links libnclaw.a static library into the iOS app build.
#          Provides NclawModule Objective-C++ sources to the Xcode project.
#
# Inputs:  ios/libs/libnclaw.a (Rust static lib for aarch64-apple-ios + simulator)
#          ios/libs/nclaw.h (cbindgen-generated C header)
#          ios/NclawModule.mm + ios/NclawModule.h
#
# Usage: Referenced by nclaw/mobile's Podfile as a path dependency.
#        scripts/build.sh must run before pod install.
#
# Cross-ref: T-P3-E4-W2-S3-T03 (this ticket)
#            scripts/build.sh (cross-compile script producing libnclaw.a)

Pod::Spec.new do |spec|
  spec.name         = 'NclawModule'
  spec.version      = '0.1.0'
  spec.summary      = 'libnclaw Rust FFI bridge for React Native (NitroModules JSI)'
  spec.description  = <<~DESC
    Bridges libnclaw Rust C-ABI to React Native JSI via react-native-nitro-modules.
    Exposes crypto, dampers, core, db, llm, vault, and sync FFI groups from the
    nclaw/core audit (T-P3-E4-W1-S1-T02 §5).
  DESC
  spec.homepage     = 'https://github.com/nself-org/packages'
  spec.license      = { :type => 'MIT' }
  spec.author       = { 'nSelf' => 'dev@nself.org' }
  spec.platform     = :ios, '15.0'
  spec.source       = { :path => '.' }

  # Objective-C++ bridge sources
  spec.source_files       = 'NclawModule.{h,mm}'
  spec.public_header_files = 'NclawModule.h'

  # cbindgen-generated C header (nclaw/core C-ABI)
  spec.preserve_paths = 'libs/nclaw.h'
  spec.pod_target_xcconfig = {
    'HEADER_SEARCH_PATHS' => '$(PODS_TARGET_SRCROOT)/libs'
  }

  # Pre-built libnclaw.a static library (fat binary: device + simulator).
  # Built by scripts/build.sh — must exist before `pod install`.
  spec.vendored_libraries = 'libs/libnclaw.a'

  # Frameworks required by NclawModule.mm platform monitoring.
  spec.frameworks = 'UIKit', 'Foundation'

  # C++ standard required by libnclaw internals (Rust generates C++ compat ABI).
  spec.pod_target_xcconfig = {
    'CLANG_CXX_LANGUAGE_STANDARD' => 'c++17',
    'CLANG_CXX_LIBRARY' => 'libc++',
    'HEADER_SEARCH_PATHS' => '$(PODS_TARGET_SRCROOT)/libs',
    'OTHER_LDFLAGS' => '-lc++ -lstdc++'
  }

  # react-native-nitro-modules dependency (NitroModules framework).
  spec.dependency 'NitroModules'
end
