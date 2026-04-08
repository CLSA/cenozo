import { CN_base_element } from "./base_element.mjs"
import { CN_common } from "../common.mjs"

export class CN_element_loading_box extends CN_base_element {
  constructor(parent_el, config = {}) {
    if (!CN_common.is_object(config)) {
      throw new Error("Non-object config argument passed to CN_element_loading_box constructor");
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
}

