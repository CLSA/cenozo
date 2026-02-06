import { CN_base_input } from "./base_input.mjs"

export class CN_input_base_string extends CN_base_input {
  /**
   * Extends the parent method
   */
  _create_control_element() {
    const input_type = this.get_class_name().replace(/^CN_input_/, "");
    const control_el = this.constructor.html('<input class="form-control"></input>');
    if (["color", "email", "password"].includes(input_type)) {
      control_el.setAttribute("type", input_type);
    }
    return control_el;
  }
}
