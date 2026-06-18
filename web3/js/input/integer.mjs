import { CN_common } from "../common.mjs"
import { CN_input_base_number } from "./base_number.mjs"

export class CN_input_integer extends CN_input_base_number {
  /**
   * Extends parent method
   */
  async validate() {
    const value = this.get_value();
    if (null != value && !CN_common.is_integer(value) && !value.match(/^-?[0-9]+$/)) {
      this.show_error(`"${value}" is not a valid number (decimals not allowed)`);
      return false;
    }

    return await super.validate();
  }
}
