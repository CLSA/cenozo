import { CN_base_element } from "./base_element.mjs";
import { CN_common } from "../common.mjs"
import { CN_element_label } from "./label.mjs";
import { CN_input_range } from "../input/range.mjs";
import { CN_session } from "../session.mjs"

export class CN_element_time_picker extends CN_base_element {
  #time_el;
  #time = { hours: null, minutes: null, seconds: null };
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
        tz: true,
      },
      ...config,
    });

    this.set_time(this.get_config("hours"), this.get_config("minutes"), this.get_config("seconds"));
  }

  /**
   * ADD DOCS
   */
  get_time() {
    return this.#time;
  }

  /**
   * ADD DOCS
   */
  get_time_as_date() {
    const date = CN_common.get_date();
    date.setHours(this.#time.hours);
    date.setMinutes(this.#time.minutes);
    if (this.get_config("show_seconds")) date.setSeconds(this.#time.seconds);
    date.setMilliseconds(0);
    return date;
  }

  /**
   * ADD DOCS
   */
  set_time(hours = 12, minutes = 0, seconds = 0) {
    this.#time.hours = Number(hours);
    this.#time.minutes = Number(minutes);
    this.#time.seconds = Number(seconds);
    this.update_element();
  }

  /**
   * ADD DOCS
   */
  set_to_now() {
    const date = CN_common.get_date();
    this.set_time(date.getHours(), date.getMinutes(), date.getSeconds());
    this.update_element();
  }

  /**
   * ADD DOCS
   */
  async on_time_change() {
    console.log("on_time_change");

    this.set_time(
      this.#hours_input.get_value_for_record(),
      this.#minutes_input.get_value_for_record(),
      this.get_config("show_seconds") ? this.#seconds_input.get_value_for_record() : 0
    );

    const min = this.get_config("get_min")();
    const max = this.get_config("get_max")();

    if (CN_common.is_date(min)) {
      if (min > this.get_time_as_date()) await this.set_time(min.getHours(), min.getMinutes(), min.getSeconds());
    }

    if (CN_common.is_date(max)) {
      if (max < this.get_time_as_date()) await this.set_time(max.getHours(), max.getMinutes(), max.getSeconds());
    }

    this.update_element();
  }

  /**
   * Extend parent method
   */
  update_element() {
    super.update_element();

    if (
      !this.#time_el ||
      !this.#hours_input ||
      !this.#minutes_input ||
      (this.get_config("show_seconds") && !this.#seconds_input)
    ) return;

    this.#hours_input.set_value(this.#time.hours);
    this.#minutes_input.set_value(this.#time.minutes);
    if (this.get_config("show_seconds")) this.#seconds_input.set_value(this.#time.seconds);

    let time_string = CN_common.format_time(this.get_time_as_date(), this.get_config("show_seconds"));
    if (this.get_config("tz")) {
      const tz = Intl.DateTimeFormat(
        'en-CA',
        { timeZone: CN_session.get("user", "timezone"), timeZoneName: "short" }
      ).formatToParts(CN_common.get_date()).find(o => o.type == "timeZoneName").value;
      time_string += ` ${tz}`;
    }
    this.#time_el.innerHTML = time_string;
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
      get_default: () => this.#time.hours,
      on_input: async (form_input, valid) => await this.on_time_change(),
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
      get_default: () => this.#time.minutes,
      on_input: async (form_input, valid) => await this.on_time_change(),
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
        get_default: () => this.#time.seconds,
        on_input: async (form_input, valid) => await this.on_time_change(),
      });
      seconds_div_el.append(this.#seconds_input.get_element());
    }

    return el;
  }
}
