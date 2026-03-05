import { CN_base_element } from "./base_element.mjs"
import { CN_common } from "../common.mjs"

export class CN_element_label extends CN_base_element {
  constructor(parent_el, config = {}) {
    if (!CN_common.is_object(config)) {
      throw new Error("Non-object config argument passed to CN_element_label contructor");
    }

    // don't replace classes, append them instead
    config.class = ["col-form-label text-end fw-bold", config.class].join(" ").trim();

    super(parent_el, {
      ...{
        // default config
        type: "label",
        for: null, // the ID the label refers to
        value: "Label",
        help: null, // If defined this text will appear in a popup bubble
      },
      ...config
    });
  }

  /**
   * Extend parent method
   */
  _create_element() {
    const el = super._create_element();
    el.innerHTML = this.get_config("value");

    const for_value = this.get_config("for");
    if (null != for_value) el.setAttribute("for", for_value);

    const help = this.get_config("help");
    if (help) {
      el.innerHTML = `<i class="bi-info-circle-fill"></i> ${el.innerHTML}`;
      el.setAttribute("data-bs-toggle", "tooltip");
      el.setAttribute("data-bs-title", help);
      new bootstrap.Tooltip(el);
    }

    return el;
  }

  /**
   * Convenience method to create and render the element (without needing access to the created object)
   * @param object params: The parameters sent to the class constructor
   * @return Element
   */
  static create_element(parent_el = null, config = {}) {
    const el = new CN_element_label(parent_el, config).get_element();
    if (parent_el) parent_el.append(el);
    return el;
  }
}
