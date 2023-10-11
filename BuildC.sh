rm -f test.html test.js test.wasm
rm -f public/test.wasm

emcc test.c -s WASM=1 -s EXPORTED_FUNCTIONS="['_createArray']" -o test.html -s ENVIRONMENT=web

cp test.wasm public/


echo "Process completed!"
