import { CN_common } from "../common.mjs"
import { CN_input_base_string } from "./base_string.mjs"

export class CN_input_email extends CN_input_base_string {
  /**
   * Extends parent method
   */
  async validate() {
    const re = new RegExp(
      "^(" +
        "([a-zA-Z0-9]+)|" +
        "([a-zA-Z0-9]+((?:_[a-zA-Z0-9]+)|(?:\\.[a-zA-Z0-9]+))*)" +
      ")" +
      "(" +
        "@((?:[\\w-]+\\.)*\\w[\\w-]{0,66})\\." +
        "([a-zA-Z]{2,6}(?:\\.[a-zA-Z]{2})?)$" +
      ")"
    );

    const value = this.get_value();
    if (CN_common.is_string(value) && !value.match(re)) {
      this.show_error(`"${value}" is not a valid email address`);
      return false;
    }

    return await super.validate();
  }
}
