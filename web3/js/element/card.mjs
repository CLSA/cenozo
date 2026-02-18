import CN_common from "../common.mjs"
import { CN_base_element } from "./base_element.mjs"

export class CN_element_card extends CN_base_element {
  constructor(parent_el, config = {}) {
    if (!CN_common.is_object(config)) {
      throw new Error("Non-object config argument passed to CN_element_card contructor");
    }

    // don't replace classes, append them instead
    config.class = ["container-fluid mb-2 p-0", config.class].join(" ").trim();

    super(parent_el, {
      ...{
        // default config
        type: "div",
        header: null,
        body: null,
        footer: null,
      },
      ...config
    });
  }

  /**
   * Extend parent method
   */
  _create_element() {
    const el = super._create_element();
    el.append(this.constructor.html(`
      <div class="card">
        <div class="card-header text-bg-primary fw-bold fs-5"></div>
        <div class="card-body"></div>
        <div class="card-footer text-bg-secondary fs-5"></div>
      </div>
    `));

    const header = this.get_config("header");
    const header_el = el.querySelector(".card-header");
    if (CN_common.is_string(header)) {
      header_el.innerHTML = header;
    } else if (CN_common.is_element(header)) {
      header_el.append(header);
    } else if (!header) {
      header_el.remove();
    }

    const body = this.get_config("body");
    const body_el = el.querySelector(".card-body");
    if (CN_common.is_string(body)) {
      body_el.innerHTML = body;
    } else if (CN_common.is_element(body)) {
      body_el.append(body);
    } else if (!body) {
      body_el.remove();
    }

    const footer = this.get_config("footer");
    const footer_el = el.querySelector(".card-footer");
    if (CN_common.is_string(footer)) {
      footer_el.innerHTML = footer;
    } else if (CN_common.is_element(footer)) {
      footer_el.append(footer);
    } else if (!footer) {
      footer_el.remove();
    }

    return el;
  }

  /**
   * Convenience method to create and render the element (without needing access to the created object)
   * @param object params: The parameters sent to the class constructor
   * @return Element
   */
  static create_element(parent_el = null, config = {}) {
    const el = new CN_element_card(parent_el, config).get_element();
    if (parent_el) parent_el.append(el);
    return el;
  }
}
