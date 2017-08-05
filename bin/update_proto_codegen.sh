#!/bin/bash -ex

this_dir=$(dirname $0)
pbjs_executable=$this_dir/../nodejs/node_modules/protobufjs/bin/pbjs
pbts_executable=$this_dir/../nodejs/node_modules/protobufjs/bin/pbts

$pbjs_executable -r "../srcdeps/proto-gen-ts/allproto" -w commonjs -t static-module --no-encode --no-decode $this_dir/../proto/*.proto > $this_dir/../ts/srcdeps/proto-gen-ts/allproto.js
$pbts_executable $this_dir/../ts/srcdeps/proto-gen-ts/allproto.js > $this_dir/../ts/srcdeps/proto-gen-ts/allproto.d.ts

echo ""
echo "coerce gen'd code to use a relative path to the protobufjs core libs:"
sed -i '' '4s/.*/var $protobuf = require("..\/protobufjs\/minimal.js");/' $this_dir/../ts/srcdeps/proto-gen-ts/allproto.js
sed -i '' '1s/.*/import * as $protobuf from "..\/protobufjs";/' $this_dir/../ts/srcdeps/proto-gen-ts/allproto.d.ts
