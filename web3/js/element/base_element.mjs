import CN_common from "../common.mjs"
import CN_session from "../session.mjs"
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
  constructor(parent_el, config = {}) {
    if (!CN_common.is_object(config)) {
      throw new Error("Non-object config argument passed to CN_base_element contructor");
    }

    super();

    if ("CN_base_element" == this.constructor) {
      throw new Error("Abstract class CN_base_element can't be instantiated.");
    }

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

    this.set_parent_element(parent_el);
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
   * ADD DOCS
   */
  get_element() {
    if (undefined === this.#el) {
      this.#el = this._create_element();
      this.update_element();
    }
    return this.#el;
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
  async on_dom_add() {}

  /**
   * ADD DOCS
   */
  async on_dom_remove() {}

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
   * Creates a breadcrumb trail based on a model list
   * @param [model] model_list: A list of models in their trail order
   * @return Element
   */
  static async create_breadcrumb_trail(base_name, model_list = []) {
    // create a list of all crumbs (adding chevrons later)
    const crumb_list = [];

    if ([null, "Error"].includes(base_name)) {
      const unread = 0 == CN_session.system_message_list.filter(message => message.unread).length;
      crumb_list.push({
        name: unread ? "Home" : 'Home <i class="bi-envelope-fill text-warning"></i>',
        path: ""
      });
    }

    if (null != base_name) crumb_list.push({ name: base_name, path: null });

    // run all get_text() async calls in parallel
    await Promise.all(model_list.map(model => (async () => {
      let crumb = { name: "...", path: "view" == model.get_action_name() ? model.get_view_url() : null };
      crumb_list.push(crumb);

      // get the name after we've added the crumb to the list, otherwise it may be out of order
      crumb.name = await model.get_action().get_text("crumb");
    })()));

    // add each crumb to the trail, interspersed by chevrons
    const root_el = this.html("<div></div>");
    let last_crumb_el = null;
    crumb_list.forEach(crumb => {
      root_el.append(this.html('<i class="bi-chevron-compact-right text-light"></i>'));
      let crumb_el = this.html(`
        <button
          class="btn btn-primary px-1"
          data-bs-dismiss="offcanvas"
          data-bs-target="#main-menu-offcanvas"
        >${crumb.name}</button>
      `);
      last_crumb_el = crumb_el;
      root_el.append(crumb_el);
      if (null == crumb.path) {
        crumb_el.setAttribute("disabled", true);
      } else {
        crumb_el.addEventListener("click", CN_session.navigate_to.bind(CN_session, crumb.path));
      }
    });

    // the last crumb shuold always be disabled
    if (last_crumb_el) last_crumb_el.setAttribute("disabled", true);

    return root_el;
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
}
