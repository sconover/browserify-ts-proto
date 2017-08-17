import { Hello } from "../src/Hello"
import { MyLists } from "../src/MyLists"
import { list } from "../srcdeps/proto-gen-ts/allproto"


/* tslint:disable */
// for now this is js-like code, so disable tslint

console.log("Init start")

// Random hello-world type stuff. Check the browser console.
new Hello().run()


// This is typical mvdom code like you'd find in the examples
// here: https://www.npmjs.com/package/mvdom
//
// The code below is javascript-with-a-little-typescript.
// Note that the model object (shoppingList) is strongly typed,
// and we get the benefit of code completion, IDE red squigglies, etc.
//
// Even better would be to create an mvdom typescript definition,
// but that's out of scope for this project.

declare function require(name:string): any;
let d = require("../uideps/mvdom")

document.addEventListener("DOMContentLoaded", () => {
  d.display("ShoppingView", d.first("#shopping"), new MyLists().getShoppingList())
})

d.register("ShoppingView",{
	create: function() {
    return `<div class='ShoppingView'>
              <div class="list">hi, i'm the empty list</div>
            </div>`
	},

	init: function(shoppingList: list.List){
    let view = this
    let listEl = d.first(view.el, ".list")
    listEl.innerHTML = ""

    let nameDiv = document.createElement("div")
    nameDiv.textContent = shoppingList.name
    listEl.appendChild(nameDiv)

    let ul = document.createElement("ul")
    for (let listItem of shoppingList.items) {
      let li = document.createElement("li")
      li.textContent = listItem.name || ""
      ul.appendChild(li)
    }

    listEl.appendChild(ul)
  }
})

console.log("Init done")
