import { CN_input_base_string } from "./base_string.mjs"

export class CN_input_color extends CN_input_base_string {
  /**
   * Convenience method to create and add to a parent element (without needing access to the created object)
   * @param object params: The parameters sent to the class constructor
   * @return Element
   */
  static create_element(parent_el = null, config = {}) {
    const el = new CN_input_color(parent_el, config).get_element();
    if (parent_el) parent_el.append(el);
    return el;
  }
}
