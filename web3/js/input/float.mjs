import { CN_input_base_number } from "./base_number.mjs"

export class CN_input_float extends CN_input_base_number {
  /**
   * Extends parent method
   */
  async validate() {
    const value = this.get_value();
    if (null != value && "" !== value && !value.match(/^-?(([0-9]+\.?)|([0-9]*\.[0-9]+))$/)) {
      this.show_error(`"${value}" is not a valid decimal number`);
      return false;
    }

    return await super.validate();
  }
}
