import { CN_base_element } from "../base_element.mjs"

const default_config = {
  type: "label",
  class: "col-form-label text-end fw-bold",
  for: null, // the ID the label refers to
  value: "Label",
  help: null, // If defined this text will appear in a popup bubble
};

export class CN_form_label extends CN_base_element {
  constructor (config) {
    super({...default_config, ...config});
  }

  /**
   * Creates a form label
   * @param object params: An object that has value, for and name properties
   * @return Element
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
  static create(config) { return (new CN_form_label(config)).render(); }
}
