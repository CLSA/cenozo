import CN_common from "../../common.mjs"
import { CN_input_enum } from "./enum.mjs"

const default_config = {
  enum: {
    values: [
      {key: 1, value: "Yes", disabled: false},
      {key: 0, value: "No", disabled: false}
    ],
  },
};

export class CN_input_boolean extends CN_input_enum {
  constructor(config = {}) {
    if (!CN_common.is_object(config)) {
      throw new Error("Non-object config argument passed to CN_input_boolean contructor");
    }

    // don't replace the enum property in the config if it's an object, merge it with the default instead
    if (CN_common.is_object(config.enum)) {
      config.enum = {...default_config.enum, ...config.enum};
    }

    super({...default_config, ...config});
  }

  /**
   * Extends parent method
   */
  get_formatted_value() {
    const value = this.get_value();
    return "" == value ? null : Number(value);
  }

  /**
   * Convenience method to create and render the element (without needing access to the created object)
   * @param object params: The parameters sent to the class constructor
   * @return Element
   */
  static create(config) { return (new CN_input_boolean(config)).render(); }
}
