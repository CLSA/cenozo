import CN_common from "../../common.mjs"

import { CN_base_input } from "./base_input.mjs"
import { CN_modal_datetime } from "../modal/datetime.mjs"

export class CN_input_base_datetime extends CN_base_input {
  #date;

  constructor(parent_el, config = {}) {
    if (!CN_common.is_object(config)) {
      throw new Error("Non-object config argument passed to CN_input_base_datetime contructor");
    }

    super(parent_el, config);

    if ("CN_input_base_datetime" == this.constructor) {
      throw new Error("Abstract class CN_input_base_datetime can't be instantiated.");
    }
  }

  /**
   * Extend parent method
   */
  set_value(value) {
    const input_type = this.get_class_name().replace(/^CN_input_/, "");

    this.#date = value;

    // convert date object to string
    super.set_value(value ? CN_common.format_datetime(value.toISOString(), input_type, true) : null);
  }

  /**
   * Extends the parent method
   */
  async get_value_for_record() {
    return CN_common.is_date(this.#date) ? this.#date.getISOString() : null;
  }

  /**
   * Extends the parent method
   */
  _create_control_element() {
    const input_type = this.get_class_name().replace(/^CN_input_/, "");
    const control_el = this.constructor.html('<input class="form-control"></input>');
    control_el.addEventListener("click", async () => {
      let value = this.get_value_for_record();
      const date = null == value ? null : new Date(value);
      const response = await (new CN_modal_datetime({ mode: input_type, value: date })).open();
      if (undefined !== response) this.set_value(response);
    });
    return control_el;
  }
}
