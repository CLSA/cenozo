import { CN_input_base_string } from "./base_string.mjs"

export class CN_input_email extends CN_input_base_string {
  /**
   * Extends parent method
   */
  validate() {
    const value = this.get_value();
    if (!value.match(/^(([a-zA-Z0-9]+)|([a-zA-Z0-9]+((?:_[a-zA-Z0-9]+)|(?:\.[a-zA-Z0-9]+))*))(@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-zA-Z]{2,6}(?:\.[a-zA-Z]{2})?)$)/)) {
      this.show_error(`"${value}" is not a valid email address`);
      return false;
    }

    return super.validate();
  }
}
