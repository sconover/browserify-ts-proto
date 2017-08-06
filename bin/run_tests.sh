#!/bin/bash -ex

# Run mocha tests

this_dir=$(dirname $0)
test_file_pattern="**/*Test.ts"

if [ ! -z "$1" ]; then
  test_file_pattern=$1
  echo "overriding test file pattern with: $test_file_pattern"
fi

bash -c "cd $this_dir/../ts && ../nodejs/node_modules/.bin/mocha  --compilers ts:ts-node/register,tsx:ts-node/register --ui tdd test/$test_file_pattern"
