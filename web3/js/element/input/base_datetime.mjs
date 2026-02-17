import { CN_base_input } from "./base_input.mjs"
import { CN_modal_datetime } from "../modal/datetime.mjs"

export class CN_input_base_datetime extends CN_base_input {
  /**
   * Extends the parent method
   */
  _create_control_element() {
    const input_type = this.get_class_name().replace(/^CN_input_/, "");
    const control_el = this.constructor.html('<input class="form-control"></input>');
    control_el.addEventListener("click", async () => {
      const modal = new CN_modal_datetime({ mode: input_type });
      this.set_value(await modal.open());
    });
    return control_el;
  }
}
