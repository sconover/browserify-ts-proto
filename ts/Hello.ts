import { Now } from "./Now"
class Hello {
  run() {
    console.log("hello world")
    new Now().print()
  }
}

new Hello().run()