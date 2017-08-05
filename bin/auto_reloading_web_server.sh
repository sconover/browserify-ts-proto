#!/bin/bash -ex

this_dir=$(dirname $0)
bash -c "cd $this_dir/../web && ../nodejs/node_modules/.bin/live-server --port=9090 --no-browser"
