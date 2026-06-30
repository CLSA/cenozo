import { CN_input_date } from "./date.mjs"

export class CN_input_dod extends CN_input_date {
  #dob = null;

  constructor(parent_el, config = {}) {
    super(parent_el, {
      ...{
        get_dob: () => null,
      },
      ...config
    });
  }

  /**
   * Extend parent method
   */
  async _get_value_postfix() {
    let postfix = await super._get_value_postfix();

    // calculate the dod based on the dob (if it is provided)
    const dob = await this.get_config("get_dob")();
    if (dob) {
      const age = (new Date(this.get_date() - dob)).getFullYear() - 1970;
      postfix += ` (${age} year${1 == age ? "" : "s"} old)`;
    }
    return postfix;
  }
}
