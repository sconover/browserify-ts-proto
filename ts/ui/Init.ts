import { MyLists } from "../src/MyLists"
import { Hello } from "../src/Hello"
import { list } from "../srcdeps/proto-gen-ts/allproto"

console.log("Init start")

new Hello().run()


// mvdom

declare function require(name:string);
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
