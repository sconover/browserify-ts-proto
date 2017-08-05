import "../testdeps/mocha/mocha"
declare function require(name:string);
var assert = require("../testdeps/assert/assert.js")

import { list } from "../srcdeps/proto-gen-ts/allproto"

// this is just a demonstration.
// there's no great reason to unit-test toJSON,
// since it's library code from another project.
suite("list message", () => {
  test("to json", () => {
    let shoppingList = list.List.create({name: "shopping"})
    shoppingList.items.push(list.Item.create({name: "coffee"}))
    shoppingList.items.push(list.Item.create({name: "cat food"}))

    assert.deepEqual({
      "name": "shopping",
      "items":[
        {"name": "coffee"},
        {"name": "cat food"}
      ]
    }, shoppingList.toJSON())
  })
})
