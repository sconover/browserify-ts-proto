import { list } from "../srcdeps/proto-gen-ts/allproto"
import { Now } from "./Now"
class Hello {
  run() {
    console.log("hello world 10")
    new Now().print()

    let shoppingList = list.List.create({name: "shopping"})
    shoppingList.items.push(list.Item.create({name: "coffee"}))
    shoppingList.items.push(list.Item.create({name: "cat food"}))
    
    console.log(shoppingList)
  }
}

new Hello().run()