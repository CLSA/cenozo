import { CN_base_object } from "../base_object.mjs"

const default_config = {
  type: "div", // the root element type
  id: null, // will be added to the element as an attribute if defined
  name: null, // will be added to the element as an attribute if defined
  class: null, // will be added to the element as an attribute if defined
};

export class CN_base_element extends CN_base_object {
  #config = new Map();

  /**
   * Constructor
   * @param object config: A set of key/value pairs containing all of the modal's configuration parameters
   */
  constructor(config) {
    super();

    // store all properties in the config parameter
    config = {...default_config, ...config};
    for(const name in config) {
      this.#config.set(name, config[name]);
    }
  }

  /**
   * Determines whether a config value exists
   * @param string name: The name of the variable
   * @return boolean
   */
  has_config(name) {
    return this.#config.has(name);
  }

  /**
   * Gets the value of a configuration variable
   * @param string name: The name of the variable
   * @return mixed
   */
  get_config(name) {
    if (!this.#config.has(name)){
      console.warn(`Referencing config undefined parameter "${name}" in ${this.get_class_name()} modal`);
    }
    return this.#config.get(name);
  }

  /**
   * Sets the value of a configuration variable
   * @param string name: The name of the variable
   * @param mixed value: The value to set the variable to
   */
  set_config(name, value) {
    this.#config.set(name, value);
  }

  /**
   * ADD DOCS
   */
  render() {
    const el = document.createElement(this.get_config("type"));

    const id = this.get_config("id");
    if (null != id) el.setAttribute("id", id);
    const name = this.get_config("name");
    if (null != name) el.setAttribute("name", name);
    const class_list = this.get_config("class");
    if (null != class_list) el.classList = class_list;

    return el;
  }
}
