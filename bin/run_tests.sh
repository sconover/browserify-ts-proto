#!/bin/bash -ex

this_dir=$(dirname $0)
js_out_dir=/tmp/jsout
test_file_pattern="**/*Test.js"

if [ ! -z "$1" ]; then
  test_file_pattern=$1
  echo "overriding test file pattern with: $test_file_pattern"
fi

bash -c "cd $this_dir/../ts && node_modules/.bin/tsc --project . --outDir $js_out_dir && node_modules/.bin/mocha --ui tdd $js_out_dir/test/$test_file_pattern"
