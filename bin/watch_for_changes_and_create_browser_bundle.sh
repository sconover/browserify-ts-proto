#!/bin/bash -ex

this_dir=$(dirname $0)

bash -c "cd $this_dir/../ts && node node_modules/watchify/bin/cmd.js --require protobufjs/minimal -v -d src/Hello.ts -p [ tsify --noImplicitAny ] -o ../web/bundle.js"
