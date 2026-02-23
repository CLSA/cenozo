export class CN_base_object {
  constructor() {
    if ("CN_base_object" == this.constructor) {
      throw new Error("Abstract class CN_base_object can't be instantiated.");
    }
  }

  get_class_name() { return this.constructor.name; }
}
