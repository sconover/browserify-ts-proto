import { list } from "../srcdeps/proto-gen-ts/allproto"
import { MyLists } from "./MyLists"
import { Now } from "./Now"
export class Hello {
  getShoppingList(): list.List {
    let shoppingList = list.List.create({name: "shopping"})
    shoppingList.items.push(list.Item.create({name: "coffee"}))
    shoppingList.items.push(list.Item.create({name: "cat food"}))
    return shoppingList
  }

  run() {
    console.log("hello world 10")
    new Now().print()

    console.log(new MyLists().getShoppingList())
  }
}