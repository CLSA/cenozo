import CN_common from "../common.mjs"
import CN_session from "../session.mjs"

import { CN_base_element } from "./base_element.mjs";
import { CN_element_label } from "./label.mjs";
import { CN_input_range } from "./input/range.mjs";

export class CN_element_time_picker extends CN_base_element {
  #time_el;
  #hour_input;
  #minute_input;
  #second_input;

  constructor(parent_el, config = {}) {
    if (!CN_common.is_object(config)) {
      throw new Error("Non-object config argument passed to CN_element_time_picker contructor");
    }

    super(parent_el, {
      ...{
        // default config
        show_seconds: true,
      },
      ...config,
    });
  }

  /**
   * ADD DOCS
   */
  get_time() {
    const date = new Date();
    date.setHours(this.#hour_input.get_value());
    date.setMinutes(this.#minute_input.get_value());
    if (this.get_config("show_seconds")) {
      date.setSeconds(this.#minute_input.get_value());
    } else {
      date.setSeconds(0);
    }
    date.setMilliseconds(0);

    return date
  }
  /**
   * ADD DOCS
   */
  set_time(date) {
    this.#hour_input.set_value(date.getHours());
    this.#minute_input.set_value(date.getMinutes());
    if (this.get_config("show_seconds")) this.#second_input.set_value(date.getSeconds());
  }
 
  /**
   * ADD DOCS
   */
  set_to_now() {
    this.set_time(new Date());
    this.update_element();
  }

  /**
   * Extend parent method
   */
  update_element() {
    super.update_element();

    const date = new Date();
    date.setHours(Number(this.#hour_input.get_value()));
    date.setMinutes(Number(this.#minute_input.get_value()));
    if (this.get_config("show_seconds")) date.setSeconds(Number(this.#second_input.get_value()));
    date.setMilliseconds(0);
    this.#time_el.innerHTML =
      CN_common.format_time(date, this.get_config("show_seconds")) + ` (${CN_session.data.user.timezone})`;
  }

  /**
   * Extend parent method
   */
  _create_element() {
    const el = this.constructor.html('<div class="container-fluid"></div>');

    const time_div_el = this.constructor.html('<div class="row"></div>');
    el.append(time_div_el);
    CN_element_label.create_element(time_div_el, { class: "col-3", value: "Time" });
    this.#time_el = this.constructor.html('<div name="time" class="col-form-label col-9"></div>');
    time_div_el.append(this.#time_el);

    const hour_div_el = this.constructor.html('<div class="row"></div>');
    el.append(hour_div_el);
    CN_element_label.create_element(hour_div_el, { for: "hour", class: "col-3", value: "Hour" });
    this.#hour_input = new CN_input_range(hour_div_el, {
      id: "hour",
      class: "col-9",
      min: 0,
      max: 23,
      get_default: () => 12,
      on_input: (form_input, valid) => this.update_element(),
    });
    hour_div_el.append(this.#hour_input.get_element());

    const minute_div_el = this.constructor.html('<div class="row"></div>');
    el.append(minute_div_el);
    CN_element_label.create_element(minute_div_el, { for: "minute", class: "col-3", value: "Minute" });
    this.#minute_input = new CN_input_range(minute_div_el, {
      id: "minute",
      class: "col-9",
      min: 0,
      max: 59,
      get_default: () => 0,
      on_input: (form_input, valid) => this.update_element(),
    });
    minute_div_el.append(this.#minute_input.get_element());

    if (this.get_config("show_seconds")) {
      const second_div_el = this.constructor.html('<div class="row"></div>');
      el.append(second_div_el);
      CN_element_label.create_element(second_div_el, { for: "second", class: "col-3", value: "Second" });
      this.#second_input = new CN_input_range(second_div_el, {
        id: "second",
        class: "col-9",
        min: 0,
        max: 59,
        get_default: () => 0,
        on_input: (form_input, valid) => this.update_element(),
      });
      second_div_el.append(this.#second_input.get_element());
    }

    return el;
  }
}
