import { CN_base_element } from "./base_element.mjs";
import { CN_common } from "../common.mjs"
import { CN_element_label } from "./label.mjs";
import { CN_input_range } from "../input/range.mjs";
import { CN_session } from "../session.mjs"

export class CN_element_time_picker extends CN_base_element {
  #time_el;
  #hours_input;
  #minutes_input;
  #seconds_input;

  constructor(parent_el, config = {}) {
    if (!CN_common.is_object(config)) {
      throw new Error("Non-object config argument passed to CN_element_time_picker constructor");
    }

    super(parent_el, {
      ...{
        // default config
        show_seconds: true,
        get_min: () => null,
        get_max: () => null,
        hours: 12,
        minutes: 0,
        seconds: 0,
      },
      ...config,
    });
  }

  /**
   * ADD DOCS
   */
  get_time() {
    return {
      hours: this.#hours_input.get_value(),
      minutes: this.#minutes_input.get_value(),
      seconds: this.get_config("show_seconds") ? this.#seconds_input.get_value() : 0,
    };
  }

  /**
   * ADD DOCS
   */
  set_time(hours = 12, minutes = 0, seconds = 0) {
    this.#hours_input.set_value(hours);
    this.#minutes_input.set_value(minutes);
    if (this.get_config("show_seconds")) this.#seconds_input.set_value(seconds);
  }

  /**
   * ADD DOCS
   */
  set_to_now() {
    const date = new Date();
    this.set_time(date.getHours(), date.getMinutes(), date.getSeconds());
    this.update_element();
  }

  /**
   * ADD DOCS
   */
  on_time_change() {
    const min = this.get_config("get_min")();
    const max = this.get_config("get_max")();

    if (CN_common.is_date(min)) {
      const date = CN_common.clone(min);
      date.setHours(Number(this.#hours_input.get_value()));
      date.setMinutes(Number(this.#minutes_input.get_value()));
      if (this.get_config("show_seconds")) date.setSeconds(Number(this.#seconds_input.get_value()));
      date.setMilliseconds(0);
      if (min > date) {
        this.#hours_input.set_value(min.getHours());
        this.#minutes_input.set_value(min.getMinutes());
        if (this.get_config("show_seconds")) this.#seconds_input.set_value(min.getSeconds());
      }
    }

    if (CN_common.is_date(max)) {
      const date = CN_common.clone(max);
      date.setHours(Number(this.#hours_input.get_value()));
      date.setMinutes(Number(this.#minutes_input.get_value()));
      if (this.get_config("show_seconds")) date.setSeconds(Number(this.#seconds_input.get_value()));
      date.setMilliseconds(0);
      if (max < date) {
        this.#hours_input.set_value(max.getHours());
        this.#minutes_input.set_value(max.getMinutes());
        if (this.get_config("show_seconds")) this.#seconds_input.set_value(max.getSeconds());
      }
    }
    this.update_element();
  }

  /**
   * Extend parent method
   */
  update_element() {
    super.update_element();

    const date = new Date();
    date.setHours(Number(this.#hours_input.get_value()));
    date.setMinutes(Number(this.#minutes_input.get_value()));
    if (this.get_config("show_seconds")) date.setSeconds(Number(this.#seconds_input.get_value()));
    date.setMilliseconds(0);
    const tz = Intl.DateTimeFormat(
      'en-CA',
      { timeZone: CN_session.get("user", "timezone"), timeZoneName: "short" }
    ).formatToParts(new Date()).find(o => o.type == "timeZoneName").value;
    this.#time_el.innerHTML = CN_common.format_time(date, this.get_config("show_seconds")) + ` ${tz}`;
  }

  /**
   * Extend parent method
   */
  _create_element() {
    const el = this.constructor.html('<div class="container-fluid"></div>');

    const time_div_el = this.constructor.html('<div class="row"></div>');
    el.append(time_div_el);
    CN_element_label.append(time_div_el, { class: "col-3", value: "Time" });
    this.#time_el = this.constructor.html('<div name="time" class="col-form-label col-9"></div>');
    time_div_el.append(this.#time_el);

    const hours_div_el = this.constructor.html('<div class="row"></div>');
    el.append(hours_div_el);
    CN_element_label.append(hours_div_el, { for: "hours", class: "col-3", value: "Hour" });
    this.#hours_input = new CN_input_range(hours_div_el, {
      id: "hours",
      class: "col-9",
      min: 0,
      max: 23,
      get_default: () => this.get_config("hours"),
      on_input: (form_input, valid) => this.on_time_change(),
    });
    hours_div_el.append(this.#hours_input.get_element());

    const minutes_div_el = this.constructor.html('<div class="row"></div>');
    el.append(minutes_div_el);
    CN_element_label.append(minutes_div_el, { for: "minutes", class: "col-3", value: "Minute" });
    this.#minutes_input = new CN_input_range(minutes_div_el, {
      id: "minutes",
      class: "col-9",
      min: 0,
      max: 59,
      get_default: () => this.get_config("minutes"),
      on_input: (form_input, valid) => this.on_time_change(),
    });
    minutes_div_el.append(this.#minutes_input.get_element());

    if (this.get_config("show_seconds")) {
      const seconds_div_el = this.constructor.html('<div class="row"></div>');
      el.append(seconds_div_el);
      CN_element_label.append(seconds_div_el, { for: "seconds", class: "col-3", value: "Second" });
      this.#seconds_input = new CN_input_range(seconds_div_el, {
        id: "seconds",
        class: "col-9",
        min: 0,
        max: 59,
        get_default: () => this.get_config("seconds"),
        on_input: (form_input, valid) => this.on_time_change(),
      });
      seconds_div_el.append(this.#seconds_input.get_element());
    }

    return el;
  }
}
