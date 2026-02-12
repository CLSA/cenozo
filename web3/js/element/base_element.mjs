import CN_common from "../common.mjs"
import { CN_base_object } from "../base_object.mjs"

export class CN_base_element extends CN_base_object {
  // The DOMParser used by create() when creating elements from HTML strings
  static #dom_parser = new DOMParser();

  #el;
  #parent_el;
  #config = new Map();

  /**
   * Constructor
   * @param object config: A set of key/value pairs containing all of the modal's configuration parameters
   */
  constructor(config = {}) {
    if (!CN_common.is_object(config)) {
      throw new Error("Non-object config argument passed to CN_base_element contructor");
    }

    super();

    // store all properties in the config parameter
    config = {
      ...{
        // default config
        type: "div", // the root element type
        id: null, // will be added to the element as an attribute if defined
        name: null, // will be added to the element as an attribute if defined
        class: null, // will be added to the element as an attribute if defined
      },
      ...config
    };
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
      console.warn(`Referencing undefined config parameter "${name}" in ${this.get_class_name()}`);
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
   * Sets the element's parent (needed to fire DOM add/remove events)
   */
  set_parent_element(parent_el) {
    this.#parent_el = parent_el;

    if (null != this.#parent_el) {
      const observer = new MutationObserver(async mutation => {
        if (this.#el) {
          if (this.#parent_el.contains(this.#el)) {
            await this.on_dom_add();
          } else {
            observer.disconnect();
            await this.on_dom_remove();
          }
        }
      });
      observer.observe(this.#parent_el, { childList: true });
    }
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
   * Creates a "please wait" blocking modal
   * @return Promise
   */
  static async wait_for(fn, delay = 500) {
    const modal_el = this.html(`
      <div class="modal fade" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header text-bg-primary">
              <h1 class="modal-title fw-bold fs-5">Please Wait...</h1>
            </div>
            <div class="modal-body text-center">
              <img src="${CENOZO_URL}/img/loading.gif"></img>
            </div>
          </div>
        </div>
      </div>
    `);
    document.getElementById("main-content").append(modal_el);
    const modal_bs = new bootstrap.Modal(modal_el, { keyboard: false, backdrop: "static" });

    // wait for delay before showing the modal
    let timeout_id = setTimeout(() => {
      // automatically dispose of the modal once finished
      modal_el.addEventListener("hidden.bs.modal", () => {
        modal_bs.dispose();
        modal_el.remove();
      });

      modal_bs.show();
      timeout_id = null;
    }, delay);

    try {
      // run the provided function
      await fn();
    } finally {
      if (null != timeout_id) {
        // if the timeout exists then the modal hasn't been shown, so just cancel it
        clearTimeout(timeout_id);
      } else {
        // if the timeout no longer exists then the modal is showing, so hide it
        modal_bs.hide();
      }
    }
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
