import { CN_common } from "../common.mjs"
import { CN_input_enum } from "./enum.mjs"
import { CN_input_float } from "./float.mjs"

export class CN_input_size extends CN_input_float {
  #size_form_input;

  constructor(parent_el, config = {}) {
    if (!CN_common.is_object(config)) {
      throw new Error("Non-object config argument passed to CN_input_size constructor");
    }

    super(parent_el, {
      ...{
        // default config
        get_min: () => 0,
      },
      ...config
    });

    const size_config = {
      required: true,
      name: "unit",
      enum: {
        values: ["Bytes", "KB", "MB", "GB", "TB", "PB"].map(str => ({ key: str, value: str })),
      },
      get_default: () => "Bytes",
      on_change: (form_input, valid) => {
        // propagate changes to the size dropdown to the parent size input
        if (this.has_config("on_change")) {
          this.get_config("on_change")(this, valid);
        }
      },
    };

    this.#size_form_input = new CN_input_enum(null, size_config);
    this.#size_form_input.get_element(); // we must create the input now
  }

  /**
   * ADD DOCS
   */
  set_disabled(disabled) {
    super.set_disabled(disabled);
    this.#size_form_input.set_disabled(disabled);
  }

  /**
   * Extend parent method
   */
  async set_value(value) {
    if (null != value) {
      // convert the value to a filesize string
      const [size, unit] = CN_common.format_filesize(Number(value)).split(" ");

      await super.set_value(size);
      await this.#size_form_input.set_value(unit ? unit : "Bytes");
    }
  }

  /**
   * Extend parent method
   */
  _create_element() {
    const el = super._create_element();

    const postfix_div_el = this.get_postfix_div_element();
    this.#size_form_input.set_parent_element(postfix_div_el);
    postfix_div_el.append(this.#size_form_input.get_element());

    return el;
  }

  /**
   * Extend parent method
   */
  async _calculate_value_for_record(value) {
    return (
      CN_common.is_float(value) ?
      CN_common.format_filesize(`${value} ${this.#size_form_input.get_value()}`, true) :
      null
    );
  }
}
