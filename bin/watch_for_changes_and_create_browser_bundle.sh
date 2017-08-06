#!/bin/bash -ex

this_dir=$(dirname $0)

# Use tsify to transform all ts into js
# Use watchify (browserify) to watch for changes in any ts files
# and then re-gen the js bundle.

bash -c "cd $this_dir/../nodejs && node node_modules/watchify/bin/cmd.js ../ts/ui/Init.ts -v -d -p [ tsify --project ../ts ] -o ../web/app.js"
