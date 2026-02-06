import CN_datetime_modal from "../../date/datetime_modal.mjs"
import { CN_base_input } from "./base_input.mjs"

export class CN_input_base_datetime extends CN_base_input {
  /**
   * Extends the parent method
   */
  _create_control_element() {
    const input_type = this.get_class_name().replace(/^CN_input_/, "");
    const control_el = this.constructor.html('<input class="form-control"></input>');
    control_el.addEventListener("click", async () => {
      const datetime_modal = new CN_datetime_modal(new Date(), input_type);
      this.set_value(await datetime_modal.open());
    });
    return control_el;
  }
}
