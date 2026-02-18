import CN_common from "../common.mjs"
import { CN_base_element } from "./base_element.mjs"

export class CN_element_loading_box extends CN_base_element {
  constructor(parent_el, config = {}) {
    if (!CN_common.is_object(config)) {
      throw new Error("Non-object config argument passed to CN_element_loading_box contructor");
    }

    // don't replace classes, append them instead
    config.class = ["container-fluid loading text-primary text-center fs-5 fw-bold", config.class].join(" ").trim();

    super(parent_el, {
      ...{
        // default config
        type: "div",
        text: null,
      },
      ...config
    });
  }

  /**
   * Extend parent method
   */
  _create_element() {
    const el = super._create_element();
    el.style.height = "9em";
    el.innerHTML = this.get_config("text");

    return el;
  }

  /**
   * Convenience method to create and render the element (without needing access to the created object)
   * @param object params: The parameters sent to the class constructor
   * @return Element
   */
  static create_element(parent_el = null, config = {}) {
    const el = new CN_element_loading_box(parent_el, config).get_element();
    if (parent_el) parent_el.append(el);
    return el;
  }
}

