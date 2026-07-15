export class CN_base_object {
  #config;

  constructor(config = {}) {
    if ("CN_base_object" == this.constructor) {
      throw new Error("Abstract class CN_base_object can't be instantiated.");
    }

    // we need to make sure config is an object, but since we can't use CN_common we have to do it manually
    if (
      !Array.isArray(config) &&
      "object" === typeof config &&
      null != config &&
      0 < Object.keys(config).length
    ) {
      this.#config = new Map();
      for (const name in config) this.#config.set(name, config[name]);
    }
  }

  /**
   * Returns the extending class name
   * @return string
   */
  get_class_name() { return this.constructor.name; }

  /**
   * Determines whether a config value exists
   * @param string name: The name of the variable
   * @return boolean
   */
  has_config(name) {
    if (undefined === this.#config) {
      throw new Error(`Tried using config in ${this.get_class_name()} class but config hasn't been setup.`);
    }
    return this.#config.has(name);
  }

  /**
   * Gets the value of a configuration variable
   * @param string name: The name of the variable
   * @return mixed
   */
  get_config(name) {
    if (undefined === this.#config) {
      throw new Error(`Tried using config in ${this.get_class_name()} class but config hasn't been setup.`);
    }
    if (!this.#config.has(name)){
      console.error(`Referencing undefined config parameter "${name}" in ${this.get_class_name()}`);
    }
    return this.#config.get(name);
  }

  /**
   * Sets the value of a configuration variable
   * @param string name: The name of the variable
   * @param mixed value: The value to set the variable to
   */
  set_config(name, value) {
    if (undefined === this.#config) {
      throw new Error(`Tried using config in ${this.get_class_name()} class but config hasn't been setup.`);
    }
    this.#config.set(name, value);
  }
}
