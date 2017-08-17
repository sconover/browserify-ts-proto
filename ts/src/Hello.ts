import { list } from "../srcdeps/proto-gen-ts/allproto"
import { MyLists } from "./MyLists"
import { Now } from "./Now"
export class Hello {
  public run(): void {
    console.log("hello world 10")
    new Now().print()

    console.log(new MyLists().getShoppingList())
  }
}
