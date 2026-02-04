import { CN_base_object } from "../base_object.mjs"

const default_config = {
  type: "div", // the root element type
  id: null, // will be added to the element as an attribute if defined
  name: null, // will be added to the element as an attribute if defined
  class: null, // will be added to the element as an attribute if defined
};

export class CN_base_element extends CN_base_object {
  // The DOMParser used by create() when creating elements from HTML strings
  static #dom_parser = new DOMParser();

  #el;
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
  _create_element() {
    const el = document.createElement(this.get_config("type"));

    const id = this.get_config("id");
    if (null != id) el.setAttribute("id", id);
    const name = this.get_config("name");
    if (null != name) el.setAttribute("name", name);
    const class_list = this.get_config("class");
    if (null != class_list) el.classList = class_list;

    return el;
  }

  /**
   * ADD DOCS
   */
  async on_dom_add() {}

  /**
   * ADD DOCS
   */
  async on_dom_remove() {}

  /**
   * ADD DOCS
   */
  render(force = false) {
    if (force || !this.#el) this.#el = this._create_element();
    return this.#el;
  }

  /**
   * Creates an element and renders it as a single operation
   * @param object config: A set of key/value pairs containing all of the modal's configuration parameters
   * @return Element
   */
  static create(config) {
    return (new Object.create(config)).render();
  }

  /**
   * Converts an HTML string into an Element object
   * @param string html: HTML expressed as a string
   * @return Element
   */
  static html(html) {
    if (undefined === html) throw new Error("element.create: must provide 1 argument, 0 provided");
    if (0 == html.length) throw new Error("element.create: argument cannot be empty");

    return (
      Array.isArray(html) ?
      // return an array of elements
      html.map(str => CN_base_element.#dom_parser.parseFromString(str, "text/html").body.firstChild) :
      // if the first character isn't opening an element then assume it is the element name only
      CN_base_element.#dom_parser.parseFromString(html, "text/html").body.firstChild
    );
  }

  /**
   * Converts an HTML string into a DocumentFragment object
   * @param string html: HTML expressed as a string
   * @return DocumentFragment
   */
  static html_fragment(html) {
    if (html == null) throw new Error("element.create_fragment: must provide 1 argument, 0 provided");
    if (0 == html.length) throw new Error("element.create: argument cannot be empty");

    const template = document.createElement('template');
    template.innerHTML = html.trim(); // Use trim() to handle leading/trailing whitespace
    return template.content.firstElementChild;
  }
}
