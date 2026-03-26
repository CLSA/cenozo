import { CN_input_base_number } from "./base_number.mjs"

export class CN_input_integer extends CN_input_base_number {
  /**
   * Extends parent method
   */
  async validate() {
    const value = this.get_value();
    if (!value.match(/^-?[0-9]+$/)) {
      this.show_error(`"${value}" is not a valid number (decimals not allowed)`);
      return false;
    }

    return await super.validate();
  }

  /**
   * Convenience method to create and add to a parent element (without needing access to the created object)
   * @param object params: The parameters sent to the class constructor
   * @return Element
   */
  static create_element(parent_el = null, config = {}) {
    const el = new CN_input_integer(parent_el, config).get_element();
    if (parent_el) parent_el.append(el);
    return el;
  }
}
