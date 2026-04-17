import { CN_common } from "../common.mjs"
import { CN_input_base_string } from "./base_string.mjs"

export class CN_input_base_number extends CN_input_base_string {
  constructor(parent_el, config = {}) {
    if (!CN_common.is_object(config)) {
      throw new Error("Non-object config argument passed to CN_input_base_number constructor");
    }

    super(parent_el, config);

    if ("CN_input_base_number" == this.constructor) {
      throw new Error("Abstract class CN_input_base_number can't be instantiated.");
    }
  }

  /**
   * Extends parent method
   */
  async validate() {
    const value = this.get_value();

    if (this.has_config("min")) {
      const min = this.get_config("min");
      if (null != min && value < min) {
        this.show_error(`The minimum number allowed is ${this.get_config("min")}`);
        return false;
      }
    }

    if (this.has_config("max")) {
      const max = this.get_config("max");
      if (null != max && value > max) {
        this.show_error(`The maximum number allowed is ${this.get_config("max")}`);
        return false;
      }
    }

    return await super.validate();
  }

  /**
   * Extends parent method
   */
  async _calculate_value_for_record(value) {
    value = await super._calculate_value_for_record(value);
    return null == value ? null : Number(value);
  }
}
