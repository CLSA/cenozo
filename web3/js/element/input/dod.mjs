import { CN_input_date } from "./date.mjs"

export class CN_input_dod extends CN_input_date {
  /**
   * Convenience method to create and render the element (without needing access to the created object)
   * @param object params: The parameters sent to the class constructor
   * @return Element
   */
  static create_element(parent_el = null, config = {}) {
    const el = new CN_input_dod(parent_el, config).get_element();
    if (parent_el) parent_el.append(el);
    return el;
  }
}
