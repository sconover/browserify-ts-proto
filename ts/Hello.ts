import { Now } from "./Now"
class Hello {
  run() {
    console.log("hello world 8")
    new Now().print()
  }
}

new Hello().run()