#!/bin/bash

# Remove old files
rm -f test.html test.js test.wasm
rm -f public/test.wasm

# Compile the C++ file with Emscripten
emcc test.cpp \
     -s WASM=1 \
     -s EXPORTED_FUNCTIONS="['_createArray']" \
     -s EXTRA_EXPORTED_RUNTIME_METHODS='["ccall", "cwrap"]' \
     -s ALLOW_MEMORY_GROWTH=1 \
     -o test.html \
     -s ENVIRONMENT=web

# Move the generated wasm binary to the public folder
cp test.wasm public/

echo "Process completed!"
