import { CN_input_base_string } from "./base_string.mjs"

export class CN_input_base_number extends CN_input_base_string {
  /**
   * Extends parent method
   */
  validate() {
    const value = this.get_value();

    if (this.has_config("min") && value < this.get_config("min")) {
      this.show_error(`The minimum number allowed is ${this.get_config("min")}`);
      return false;
    }

    if (this.has_config("max") && value > this.get_config("max")) {
      this.show_error(`The maximum number allowed is ${this.get_config("max")}`);
      return false;
    }

    return super.validate();
  }
}
