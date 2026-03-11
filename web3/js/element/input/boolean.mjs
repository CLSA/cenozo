import { CN_common } from "../../common.mjs"
import { CN_input_enum } from "./enum.mjs"

export class CN_input_boolean extends CN_input_enum {
  constructor(parent_el, config = {}) {
    if (!CN_common.is_object(config)) {
      throw new Error("Non-object config argument passed to CN_input_boolean contructor");
    }

    const values = [
      {key: true, value: "Yes", disabled: false},
      {key: false, value: "No", disabled: false}
    ];

    // don't replace the enum property in the config if it's an object, merge it with the default instead
    if (CN_common.is_object(config.enum) && !CN_common.is_array(config.enum.values)) {
      config.enum.values = values;
    }

    super(parent_el, {
      ...{
        // default config
        enum: { values: values },
      },
      ...config
    });
  }

  /**
   * Extends parent method
   */
  get_value() {
    // cast non null values as a boolean
    const value = super.get_value();
    return ["", null].includes(value) ? null : [1, true, "true"].includes(value);
  }

  /**
   * Extends parent method
   */
  async get_value_for_record() {
    const value = await super.get_value_for_record();
    return null == value ? null : Number(value);
  }

  /**
   * Convenience method to create and add to a parent element (without needing access to the created object)
   * @param object params: The parameters sent to the class constructor
   * @return Element
   */
  static create_element(parent_el = null, config = {}) {
    const el = new CN_input_boolean(parent_el, config).get_element();
    if (parent_el) parent_el.append(el);
    return el;
  }
}
