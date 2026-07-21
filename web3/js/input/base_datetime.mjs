import { CN_base_input } from "./base_input.mjs"
import { CN_common } from "../common.mjs"
import { CN_modal_datetime } from "../modal/datetime.mjs"

export class CN_input_base_datetime extends CN_base_input {
  #date = null;

  constructor(parent_el, config = {}) {
    if (!CN_common.is_object(config)) {
      throw new Error("Non-object config argument passed to CN_input_base_datetime constructor");
    }

    super(parent_el, {
      ...{
        get_min: () => null,
        get_max: () => null,
        empty_label: "(empty)",
      },
      ...config
    });

    if ("CN_input_base_datetime" == this.constructor) {
      throw new Error("Abstract class CN_input_base_datetime can't be instantiated.");
    }
  }

  /**
   * Get direct access to the internal date member
   */
  get_date() {
    return this.#date;
  }

  /**
   * Extend parent method
   */
  async set_value(value, value_for_record = undefined) {
    if (CN_common.is_string(value)) {
      value = new Date(
        value.match(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/) ?
        `${value} 12:00:00` :
        value.match(/^[0-9]{2}:[0-9]{2}:[0-9]{2}$/) ?
        `${CN_common.format_datetime(CN_common.get_date(), "date")} ${value}` :
        value
      );
    }
    this.#date = value;

    // convert date object to string
    const input_type = this.get_class_name().replace(/^CN_input_/, "");
    await super.set_value(
      value ? CN_common.format_datetime(value, input_type, true) : this.get_config("empty_label"),
      value_for_record,
    );
  }

  /**
   * Extends parent method
   */
  async validate() {
    const input_type = this.get_class_name().replace(/^CN_input_/, "");

    if (CN_common.is_date(this.#date)) {
      const min = this._determine_min_max(await this.get_config("get_min")());
      if (CN_common.is_date(min) && this.#date < min) {
        this.show_error(`Must not come before ${CN_common.format_datetime(min, input_type)}`);
        return false;
      }

      const max = this._determine_min_max(await this.get_config("get_max")());
      if (CN_common.is_date(max) && this.#date > max) {
        this.show_error(`Must not come after ${CN_common.format_datetime(max, input_type)}`);
        return false;
      }
    }

    return await super.validate();
  }

  /**
   * ADD DOCS
   */
  _determine_min_max(value) {
    const input_type = this.get_class_name().replace(/^CN_input_/, "");

    // convert special values
    if ("now" == value) {
      value = CN_common.get_date();
    } else if (CN_common.is_string(value)) {
      value = new Date(value.match(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/) ? `${value} 12:00:00` : value);
    }

    if (CN_common.is_date(value)) {
      if ("date" == input_type) {
        value.setHours(0);
        value.setMinutes(0);
        value.setSeconds(0);
      } else if (!CN_common.is_datetime_type(input_type, "second")) {
        value.setSeconds(0);
      }
      value.setMilliseconds(0);
    }

    return value;
  }

  /**
   * Extends the parent method
   */
  _create_control_element() {
    const input_type = this.get_class_name().replace(/^CN_input_/, "");
    const control_el = this.constructor.html('<input class="form-control"></input>');
    control_el.addEventListener("click", async () => {
      const config = { mode: input_type, value: this.#date };
      if (this.has_config("title")) config.title = `Select ${this.get_config("title")}`;
      const min = this._determine_min_max(await this.get_config("get_min")());
      if (CN_common.is_date(min)) config.min = min;
      const max = this._determine_min_max(await this.get_config("get_max")());
      if (CN_common.is_date(max)) config.max = max;

      const response = await CN_modal_datetime.create_and_open(config);
      if (undefined !== response) {
        await this.set_value(response);

        const valid = this.validate();
        if (this.has_config("on_change")) {
          await this.get_config("on_change")(this, valid);
        }
      }
    });
    return control_el;
  }

  /**
   * Extends the parent method
   */
  _calculate_value_for_record(value) {
    const input_type = this.get_class_name().replace(/^CN_input_/, "");
    return CN_common.format_datetime(
      this.#date,
      CN_common.is_datetime_type(input_type, "time") ? input_type : "record",
    );
  }
}
