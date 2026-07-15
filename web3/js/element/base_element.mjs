import { CN_base_object } from "../base_object.mjs"
import { CN_common } from "../common.mjs"

/**
 * Base class for all elements
 * @event domadd: ran when the element is added to the DOM
 * @event domremove: ran when the element is removed from the DOM
 */
export class CN_base_element extends CN_base_object {
  // The DOMParser used by create() when creating elements from HTML strings
  static #dom_parser = new DOMParser();

  #element;
  #parent_el;
  #event_listeners = {};

  /**
   * Constructor
   * @param object config: A set of key/value pairs containing all of the modal's configuration parameters
   */
  constructor(parent_el, config = {}) {
    if (!CN_common.is_object(config)) {
      throw new Error("Non-object config argument passed to CN_base_element constructor");
    }

    super({
      ...{
        // default config
        type: "div", // the root element type
        id: null, // will be added to the element as an attribute if defined
        name: null, // will be added to the element as an attribute if defined
        class: null, // will be added to the element as an attribute if defined
      },
      ...config
    });

    if ("CN_base_element" == this.constructor) {
      throw new Error("Abstract class CN_base_element can't be instantiated.");
    }

    // store all properties in the config parameter
    this.set_parent_element(parent_el);
  }

  /**
   * ADD DOCS
   */
  add_event_listener(type, callback, once = false) {
    if (!CN_common.is_array(this.#event_listeners[type])) this.#event_listeners[type] = [];
    this.#event_listeners[type].push({ callback: callback, once: once });
  }

  /**
   * ADD DOCS
   */
  run_event_listeners(type, ...args) {
    if (CN_common.is_array(this.#event_listeners[type])) {
      this.#event_listeners[type] = this.#event_listeners[type].filter((listener, index, arr) => {
        listener.callback(this, ...args);
        return !listener.once; // remove any listeners that are only called once
      });
    }
  }

  /**
   * ADD DOCS
   */
  get_element() {
    if (undefined === this.#element) {
      this.#element = this._create_element();
      this.update_element();
    }
    return this.#element;
  }

  /**
   * ADD DOCS
   */
  get_parent_element() {
    return this.#parent_el;
  }

  /**
   * Sets the element's parent (needed to fire DOM add/remove events)
   */
  set_parent_element(parent_el) {
    if (null != parent_el && !CN_common.is_element(parent_el)) {
      throw new Error("Setting parent element to non-element");
    }

    this.#parent_el = parent_el;

    if (null != this.#parent_el) {
      const observer = new MutationObserver(async mutation => {
        if (this.#element) {
          if (this.#parent_el.contains(this.#element)) {
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
    const type = this.get_config("type");
    const el = this.constructor.html(`<${type}></${type}>`);

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
  update_element() {}

  /**
   * ADD DOCS
   */
  async on_dom_add() {
    this.run_event_listeners("domadd");
  }

  /**
   * ADD DOCS
   */
  async on_dom_remove() {
    this.run_event_listeners("domremove");
  }

  /**
   * ADD DOCS
   */
  static set_disabled(element, disabled) {
    if (!CN_common.is_element(element)) {
      if (element) console.error(`Tried to set disabled state on non element.`);
    } else {
      if (disabled) {
        element.setAttribute("disabled", true);
        element.classList.add("disabled");
      } else {
        element.removeAttribute("disabled");
        element.classList.remove("disabled");
      }
    }
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
    document.querySelector("body").append(modal_el);
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
   * @param string input: HTML expressed as a string
   * @return Element
   */
  static html(input) {
    if (undefined === input) throw new Error("element.create: must provide 1 argument, 0 provided");

    let html = input.trim();
    if (0 == html.length) throw new Error("element.create: argument cannot be empty");

    // some elements can't be created with the dom parser, so create it using createElement() instead
    if (html.match(/^<t[drbhf]/)) {
      const template = document.createElement('template');
      template.innerHTML = html;
      return template.content.firstElementChild;
    }

    return CN_base_element.#dom_parser.parseFromString(html, "text/html").body.firstChild;
  }

  /**
   * ADD DOCS
   */
  static create(config) {
    return (new this(null, config)).get_element();
  }

  /**
   * ADD DOCS
   */
  static append(parent_el, config) {
    const obj = new this(parent_el, config)
    if (parent_el) parent_el.append(obj.get_element());
    return obj;
  }

  /**
   * ADD DOCS
   */
  static replace(parent_el, config) {
    const obj = new this(parent_el, config);
    if (parent_el) parent_el.replaceChildren(obj.get_element());
    return obj;
  }
}
