function Decorated(...args) {
  console.log("Decorator called with", args);
}

export class Foo {
  @Decorated
  public doFoo(withWhat: string) {
    console.log("Doing foo with", withWhat);
  }
}