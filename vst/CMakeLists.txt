cmake_minimum_required(VERSION 3.22)
project(FM8VST VERSION 0.1.0 LANGUAGES C CXX)

# Optional, local-only VST3 build of FM.8. Not part of `npm run build` or CI: run `npm run vst:build`.
#
# The plugin is the webvst host (https://github.com/lwojas/webvst: a JUCE WebView that fakes Web Audio for the page and
# runs webdsp's native engine on the DAW's audio thread) with FM.8 as its client. webvst is a sibling checkout, like
# webdsp, and none of its sources are copied here: this file only declares one more plugin from them, the way webvst's own
# CMakeLists does for WebSeq and WebTracker. See docs/dev/vst.md.
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

set(FM8_WEBVST_DIR "${CMAKE_CURRENT_SOURCE_DIR}/../../webvst" CACHE PATH "Path to a webvst checkout")
# The engine the page is built against (package.json: "webdsp": "file:../webdsp"), so page and plugin agree.
set(FM8_WEBDSP_DIR "${CMAKE_CURRENT_SOURCE_DIR}/../../webdsp" CACHE PATH "Path to a webdsp checkout")
cmake_path(NORMAL_PATH FM8_WEBVST_DIR)
cmake_path(NORMAL_PATH FM8_WEBDSP_DIR)

if(NOT EXISTS "${FM8_WEBVST_DIR}/src/PluginEditor.cpp")
  message(FATAL_ERROR "webvst not found at ${FM8_WEBVST_DIR}. Clone it beside FM8 (git clone https://github.com/lwojas/webvst ../webvst) or pass -DFM8_WEBVST_DIR=<path>")
endif()
if(NOT EXISTS "${FM8_WEBDSP_DIR}/native/src/engine.h")
  message(FATAL_ERROR "webdsp not found at ${FM8_WEBDSP_DIR}. Clone it beside FM8 (git clone https://github.com/lwojas/webdsp ../webdsp) or pass -DFM8_WEBDSP_DIR=<path>")
endif()

# JUCE: the same version webvst pins. A webvst build that already fetched it is reused (no download, works offline).
include(FetchContent)
if(NOT DEFINED FETCHCONTENT_SOURCE_DIR_JUCE AND EXISTS "${FM8_WEBVST_DIR}/build/_deps/juce-src/CMakeLists.txt")
  set(FETCHCONTENT_SOURCE_DIR_JUCE "${FM8_WEBVST_DIR}/build/_deps/juce-src")
  message(STATUS "Reusing JUCE from ${FETCHCONTENT_SOURCE_DIR_JUCE}")
endif()
FetchContent_Declare(JUCE
  GIT_REPOSITORY https://github.com/juce-framework/JUCE.git
  GIT_TAG 9.0.4
  GIT_SHALLOW ON)
FetchContent_MakeAvailable(JUCE)

# The page shim is a real .js file, embedded as BinaryData::shim_js.
juce_add_binary_data(WebVstData SOURCES "${FM8_WEBVST_DIR}/src/shim.js")

# The page this plugin opens. Default: the hosted app (GitHub Pages, deployed from main), like webvst's own plugins. For development point
# it at a dev server (`npm run dev` / `npm run vst:serve`, port 5175) with WEBVST_URL_FM8 (or WEBVST_URL) in the DAW's environment, or
# rebuild with -DFM8_DEFAULT_URL=http://localhost:5175/ . (A cached value in an existing build directory wins over this default.)
set(FM8_DEFAULT_URL "https://lwojas.github.io/FM8/" CACHE STRING "URL the plugin editor loads by default")

juce_add_plugin(FM8
  PRODUCT_NAME "FM8"
  COMPANY_NAME "lwojas"
  PLUGIN_MANUFACTURER_CODE Lwjs
  PLUGIN_CODE Pls8
  FORMATS VST3
  IS_SYNTH TRUE
  NEEDS_MIDI_INPUT TRUE
  NEEDS_MIDI_OUTPUT FALSE
  NEEDS_WEB_BROWSER TRUE
  COPY_PLUGIN_AFTER_BUILD FALSE)

target_sources(FM8 PRIVATE
  "${FM8_WEBVST_DIR}/src/EngineHost.cpp"
  "${FM8_WEBVST_DIR}/src/SessionState.cpp"
  "${FM8_WEBVST_DIR}/src/HostFiles.cpp"
  "${FM8_WEBVST_DIR}/src/PluginProcessor.cpp"
  "${FM8_WEBVST_DIR}/src/PluginEditor.cpp")

target_include_directories(FM8 PRIVATE "${FM8_WEBVST_DIR}/src")
target_include_directories(FM8 SYSTEM PRIVATE "${FM8_WEBDSP_DIR}/native/src")

# WEBVST_APP_ID stamps the saved state: this plugin refuses another app's state (and the other way round).
target_compile_definitions(FM8 PUBLIC
  WEBVST_APP_ID="fm8"
  WEBVST_DEFAULT_URL="${FM8_DEFAULT_URL}"
  JUCE_WEB_BROWSER=1
  JUCE_USE_CURL=0
  JUCE_VST3_CAN_REPLACE_VST2=0)

target_link_libraries(FM8 PRIVATE
  WebVstData
  juce::juce_audio_utils
  juce::juce_gui_extra
  PUBLIC juce::juce_recommended_config_flags juce::juce_recommended_warning_flags)

# macOS: a CLEAN build leaves the bundle with a broken code signature (JUCE signs it, then writes
# Contents/Resources/moduleinfo.json), which Ableton Live's scanner refuses silently. Re-sign the finished bundle as the
# very last step, ad hoc (enough to load on this machine). Same fix as webvst's CMakeLists.txt.
if(APPLE)
  add_custom_command(TARGET FM8_VST3 POST_BUILD
    COMMAND codesign --force --sign - --timestamp=none "$<GENEX_EVAL:$<TARGET_PROPERTY:FM8_VST3,JUCE_PLUGIN_ARTEFACT_FILE>>"
    COMMAND codesign --verify --strict "$<GENEX_EVAL:$<TARGET_PROPERTY:FM8_VST3,JUCE_PLUGIN_ARTEFACT_FILE>>"
    COMMENT "Signing FM8.vst3 (after moduleinfo.json was added)"
    VERBATIM)
endif()

# Headless end-to-end test (opt-in): the real EngineHost behind a stdin/stdout harness, driven by vst/test/e2e.test.ts, which runs the
# page's own code (Groovebox, controller, MIDI) through webvst's shim. `npm run vst:e2e`.
option(FM8_BUILD_E2E "Build the headless end-to-end harness" OFF)
if(FM8_BUILD_E2E)
  juce_add_console_app(FM8Harness PRODUCT_NAME "FM8Harness")
  target_sources(FM8Harness PRIVATE
    test/harness.cpp
    "${FM8_WEBVST_DIR}/src/EngineHost.cpp"
    "${FM8_WEBVST_DIR}/src/SessionState.cpp"
    "${FM8_WEBVST_DIR}/src/HostFiles.cpp")
  target_include_directories(FM8Harness PRIVATE "${FM8_WEBVST_DIR}/src")
  target_include_directories(FM8Harness SYSTEM PRIVATE "${FM8_WEBDSP_DIR}/native/src")
  target_link_libraries(FM8Harness PRIVATE
    juce::juce_core juce::juce_events juce::juce_audio_basics
    PUBLIC juce::juce_recommended_config_flags)
endif()
