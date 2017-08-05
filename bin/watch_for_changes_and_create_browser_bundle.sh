#!/bin/bash -ex

this_dir=$(dirname $0)

bash -c "cd $this_dir/../nodejs && node node_modules/watchify/bin/cmd.js ../ts/src/Hello.ts -v -d -p [ tsify --project ../ts ] -o ../web/bundle.js"
