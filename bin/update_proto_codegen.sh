#!/bin/bash -ex

this_dir=$(dirname $0)
pbjs_executable=$this_dir/../nodejs/node_modules/protobufjs/bin/pbjs
pbts_executable=$this_dir/../nodejs/node_modules/protobufjs/bin/pbts

$pbjs_executable -w commonjs -t static-module --no-encode --no-decode proto/*.proto > proto-gen-ts/allproto.js
$pbts_executable proto-gen-ts/allproto.js > proto-gen-ts/allproto.d.ts
