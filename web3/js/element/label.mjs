import { CN_base_element } from "./base_element.mjs"
import { CN_common } from "../common.mjs"

export class CN_element_label extends CN_base_element {
  constructor(parent_el, config = {}) {
    if (!CN_common.is_object(config)) {
      throw new Error("Non-object config argument passed to CN_element_label constructor");
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
      el.innerHTML = `
        <i
          class="bi bi-info-circle-fill"
          data-bs-toggle="tooltip"
          data-bs-title="${CN_common.encode_html(help)}"
        ></i> ${el.innerHTML}
      `;
      new bootstrap.Tooltip(el.querySelector(".bi-info-circle-fill"));
    }

    return el;
  }
}
