#!/bin/bash -ex

this_dir=$(dirname $0)

bash -c "cd $this_dir/../nodejs && node node_modules/watchify/bin/cmd.js --require protobufjs/minimal -v -d ../ts/Hello.ts -p [ tsify --project ../ts --noImplicitAny ] -o ../web/bundle.js"
