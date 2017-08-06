import { list } from "../srcdeps/proto-gen-ts/allproto"

export class MyLists {
  getShoppingList(): list.List {
    let shoppingList = list.List.create({name: "shopping"})
    shoppingList.items.push(list.Item.create({name: "coffee"}))
    shoppingList.items.push(list.Item.create({name: "cat food"}))
    return shoppingList
  }
}