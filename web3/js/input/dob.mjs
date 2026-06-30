import { CN_common } from "../common.mjs"
import { CN_input_date } from "./date.mjs"

export class CN_input_dob extends CN_input_date {
  #dod = null;

  constructor(parent_el, config = {}) {
    super(parent_el, {
      ...{
        get_dod: () => null,
      },
      ...config
    });
  }

  /**
   * Extend parent method
   */
  async _get_value_postfix() {
    let postfix = await super._get_value_postfix();

    // only add the current age if there is no dod
    const dod = await this.get_config("get_dod")();
    if (null == dod) {
      const age = (new Date(Date.now() - CN_common.get_date())).getFullYear() - 1970;
      postfix += ` (${age} year${1 == age ? "" : "s"} old)`;
    }
    return postfix;
  }
}
