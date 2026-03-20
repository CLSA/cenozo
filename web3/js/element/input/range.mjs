import { CN_base_input } from "./base_input.mjs"
import { CN_common } from "../../common.mjs"

export class CN_input_range extends CN_base_input {
  constructor(parent_el, config = {}) {
    if (!CN_common.is_object(config)) {
      throw new Error("Non-object config argument passed to CN_input_range contructor");
    }

    super(parent_el, {
      ...{
        // default config
        min: 1,
        max: 10,
        step: 1,
      },
      ...config,
    });
  }

  /**
   * Extends parent method
   */
  set_value(value) {
    // don't allow setting value outside of min/max range
    const min = this.get_config("min");
    const max = this.get_config("max");
    if (min > value || max < value) {
      throw new Error(`Value ${value} is out of range, must be between ${min} and ${max}`);
    }
    super.set_value(value);
  }

  /**
   * Extends the parent method
   */
  _create_control_element() {
    return this.constructor.html(`
      <input
        type="range"
        class="form-control form-range"
        min="${this.get_config("min")}"
        max="${this.get_config("max")}"
        step="${this.get_config("step")}"
      ></input>
    `);
  }

  /**
   * Extends parent method
   */
  async _calculate_value_for_record(value) {
    value = await super._calculate_value_for_record(value);
    return null == value ? null : Number(value);
  }

  /**
   * Convenience method to create and add to a parent element (without needing access to the created object)
   * @param object params: The parameters sent to the class constructor
   * @return Element
   */
  static create_element(parent_el = null, config = {}) {
    const el = new CN_input_range(parent_el, config).get_element();
    if (parent_el) parent_el.append(el);
    return el;
  }
}
