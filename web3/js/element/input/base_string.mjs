import { CN_base_input } from "./base_input.mjs"
import { CN_common } from "../../common.mjs"

export class CN_input_base_string extends CN_base_input {
  constructor(parent_el, config = {}) {
    if (!CN_common.is_object(config)) {
      throw new Error("Non-object config argument passed to CN_input_base_string constructor");
    }

    super(parent_el, config);

    if ("CN_input_base_string" == this.constructor) {
      throw new Error("Abstract class CN_input_base_string can't be instantiated.");
    }
  }

  /**
   * Extends the parent method
   */
  _create_control_element() {
    const input_type = this.get_class_name().replace(/^CN_input_/, "");
    const control_el = this.constructor.html('<input class="form-control"></input>');
    if (["color", "email", "password"].includes(input_type)) {
      control_el.setAttribute("type", input_type);

      if("password" == input_type) {
        control_el.setAttribute("autocomplete", "new-password");
      }
    }
    return control_el;
  }
}
