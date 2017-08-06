#!/bin/bash -ex

# live-server provides a webserver that auto-reloads when
# it sees changes. Note that it is watching the "web" directory,
# so when the watchify/browserify output gets rewritten,
# live-server will cause this browser to reload.

this_dir=$(dirname $0)
bash -c "cd $this_dir/../web && ../nodejs/node_modules/.bin/live-server --port=9090 --no-browser"
