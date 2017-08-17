import "../testdeps/mocha/mocha"
declare function require(name: string): any
const assert: any = require("../testdeps/assert/assert.js")

suite("foo", () => {
  test("fooTest", () => {
    console.log("in a test")
    assert.deepEqual({x: 2}, {x: 2})
  })
})
