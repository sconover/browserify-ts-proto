Author: Steve Conover / sconover at gmail dot com

===========

Motivation

This sample project explores practical workflow and feasability of
fusing protobuf schemas with typescript for core logic and data,
with a hybrid js/typescript ui layer.

The key benefit is that proto schemas may be leveraged on the web:

- Typescript-code-gen'd client library means message strutures are
   immediately discoverable via code completion (e.g. in vscode).

- Ramifications of incremental changes in the structure of data
   made "on the server side" become instantly visible in web client code:
   compiles fail, IDEs (vscode, in my case) show red squigglies.

- "Hybrid" ui glue code (typescript, but js-heavy) even gets these
   benefits.

- Comments and options from proto schemas make the contract clear to all
  parties (server and client developers). And so on.

This part of eliminating "implicit contracts"/"duck typing" in messages
passed over the wire...that blob of json that you pass around and make
assumptions about, where failures are typically only found in fully-integrated
environments (whether in a QA cycle, or its no-so-far-off equivalent in
pain/cost, end-to-end testing suites).

The above must come at very little practical productivity cost: there should
still be very little time between making a change and seeing its effects in
the browser (whether on the page, or in a browser debugging session).

===========

Running:

brew install npm
cd nodejs
npm install

in terminal window 1: bin/watch_for_changes_and_create_browser_bundle.sh
in terminal window 2: bin/auto_reloading_web_server.sh
in your browser: http://127.0.0.1:9090/hello.html

To update ts codegen on a proto change:
bin/update_proto_codegen.sh

To run unit tests:
bin/run_tests.sh

To run only one test:
bin/run_tests.sh **/SimpleTest.js

===========

Project organization:

- bin contains helpful scripts
- nodejs contains all node-related files/dependencies
- proto is for proto definitions
- ts: core, ui, and test code, plus dependencies
    Great effort is made to make source code and dependencies available
    via relative import. This is the sanest way I've found of organizing
    a typescript project, that works well for both browserify-ing and
    cli-based test runs (this is in contrast to tsconfig.json option magic).
    Many dependencies are relative symlinks into locations under
    nodejs/node_modules.
-- src: all "core app" sourcecode.
     I compare this to the kind of code that would be portable among clients
     via j2objc...networking, models, controller logic, and other business
     logic. There are ZERO dependencies on ui-related libraries.
-- srcdeps: source dependencies
     Some are symlinked to nodejs modules (per the above philosophy of
     making all ts paths relative)
--- proto-gen-ts is typescript and js code created based on aforementioned
      proto definitions
-- test: mocha unit tests ("TDD-style") of code in src, using the nodejs
     assert library
-- testdeps: test dependencies
-- ui: Build and manage the web ui.
     This is the "top-level" module, which depends on the core src module,
     plus mvdom, the web ui framework chosen for this project.
     Init.ts is the entry point of the app.
- web is html and and other static web files, plus the auto-compiled
    app.js, which starts with ui/Init.ts, and includes all of its many
    dependencies.

===========

Some notes

bash -c "cd web && ../nodejs/node_modules/.bin/live-server --port=9090"

instead of running browserify (and it exits), can use
watchify in dev to cause all this to happen immediately:

bash -c "cd nodejs && node node_modules/watchify/bin/cmd.js --require protobufjs/minimal -v -d ../ts/Hello.ts -p [ tsify --project ../ts --noImplicitAny ] -o ../web/bundle.js"

combo of watchify and live-server means that everything gets bundled
and the browser reloads on any save

You can always replace watchify with browserify to do a one-off bundle.

codegen ts from proto:

nodejs/node_modules/protobufjs/bin/pbjs -w commonjs -t static-module --no-encode --no-decode proto/list.proto > proto-gen-ts/allproto.js && nodejs/node_modules/protobufjs/bin/pbts proto-gen-ts/allproto.js > proto-gen-ts/allproto.d.ts

mocha run (fwiw, many bothans had to die to bring us this information)
node_modules/.bin/tsc --project . --outDir /tmp/out && find /tmp/out && node_modules/.bin/mocha --ui tdd /tmp/out/test/SimpleTest.js

===========

Debugging notes.

for tsc / tsify,
--traceResolution
is a must for tracking down resolution problems.


From when I couldn't figure out why protobufjs/minimal wasn't found:

node node_modules/browserify/bin/cmd.js --require protobufjs/minimal -v -d node_modules/protobufjs/minimal.d.ts ../ts/Hello.ts -p [ tsify --project ../ts --traceResolution --noImplicitAny ] -o ../web/bundle.js

It's because of course browserify isn't going to eval your code to figure out
what your runtime require's are - the dependencies just need to "be there". Thus
the browserify --require flag.
See http://www.jeromesteunou.net/browserify-why-and-how.html
for more.

===========

Deep discussion about typescript declaration vs (js) definition files,
and complications when using outDir

https://github.com/Microsoft/TypeScript/issues/7958