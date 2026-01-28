import { CN_base_input } from "./base_input.mjs"

export class CN_form_email extends CN_base_input {
  /**
   * Extends the parent method
   */
  _create_control_element() {
    return this.constructor.html('<input type="email" class="form-control"></input>');
  }

  /**
   * Extends parent method
   */
  validate() {
    const value = this.get_value();
    if (value.match(/^(([a-zA-Z0-9]+)|([a-zA-Z0-9]+((?:_[a-zA-Z0-9]+)|(?:\.[a-zA-Z0-9]+))*))(@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-zA-Z]{2,6}(?:\.[a-zA-Z]{2})?)$)/)) {
      this.show_error(`"${value}" is not a valid email address`);
      return false;
    }

    return super.validate();
  }

  /**
   * Convenience method to create and render the element (without needing access to the created object)
   * @param object params: The parameters sent to the class constructor
   * @return Element
   */
  static create(config) { return (new CN_form_email(config)).render(); }
}
