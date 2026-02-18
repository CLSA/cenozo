import CN_common from "../../common.mjs"
import { CN_input_base_string } from "./base_string.mjs"

export class CN_input_size extends CN_input_base_string {
  /**
   * Extend parent method
   */
  set_value(value) {
    // convert the value to a filesize string
    super.set_value(CN_common.format_filesize(Number(value)));
  }

  /**
   * Convenience method to create and render the element (without needing access to the created object)
   * @param object params: The parameters sent to the class constructor
   * @return Element
   */
  static create_element(parent_el = null, config = {}) {
    const el = new CN_input_size(parent_el, config).get_element();
    if (parent_el) parent_el.append(el);
    return el;
  }
}
