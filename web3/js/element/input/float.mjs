import { CN_input_base_number } from "./base_number.mjs"

export class CN_input_float extends CN_input_base_number {
  /**
   * Extends parent method
   */
  validate() {
    const value = this.get_value();
    if (!value.match(/^-?(([0-9]+\.?)|([0-9]*\.[0-9]+))$/)) {
      this.show_error(`"${value}" is not a valid decimal number`);
      return false;
    }

    return super.validate();
  }

  /**
   * Convenience method to create and render the element (without needing access to the created object)
   * @param object params: The parameters sent to the class constructor
   * @return Element
   */
  static create_element(parent_el = null, config = {}) {
    const el = new CN_input_float(parent_el, config).get_element();
    if (parent_el) parent_el.append(el);
    return el;
  }
}
