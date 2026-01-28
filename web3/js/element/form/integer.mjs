import { CN_base_input } from "./base_input.mjs"

export class CN_form_integer extends CN_base_input {
  /**
   * Extends the parent method
   */
  _create_control_element() {
    return this.constructor.html('<input class="form-control"></input>');
  }

  /**
   * Extends parent method
   */
  validate() {
    const value = this.get_value();
    if (TODO) {
      this.show_error("");
      return false;
    }

    return super.validate();
  }

  /**
   * Convenience method to create and render the element (without needing access to the created object)
   * @param object params: The parameters sent to the class constructor
   * @return Element
   */
  /**
   * Convenience method to create and render the element (without needing access to the created object)
   * @param object params: The parameters sent to the class constructor
   * @return Element
   */
  static create(config) { return (new CN_form_integer(config)).render(); }
}
