#!/bin/bash -ex

this_dir=$(dirname $0)

# Use tsify to transform all ts into js
# Use watchify (browserify) to watch for changes in any ts files
# and then re-gen the js bundle.

# extract the soucemap to a separate file using exorcist.
# (the sourcemap file is .gitignore'd)

bash -c "cd $this_dir/../nodejs && node node_modules/watchify/bin/cmd.js ../ts/ui/Init.ts -v -d -p [ tsify --project ../ts ] -o 'node_modules/.bin/exorcist ../web/app.js.map > ../web/app.js'"
