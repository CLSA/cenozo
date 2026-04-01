import { CN_base_modal } from "./base_modal.mjs";
import { CN_common } from "../../common.mjs";
import { CN_element_date_picker } from "../date_picker.mjs";
import { CN_element_time_picker } from "../time_picker.mjs";

export class CN_modal_datetime extends CN_base_modal {
  #date_picker;
  #time_picker;

  constructor(config) {
    if (!CN_common.is_object(config)) {
      throw new Error("Non-object config argument passed to CN_modal_account contructor");
    }

    super({
      ...{
        mode: "datetime",
        value: null,
        title: "Calendar",
        cancel_text: "Cancel",
        ok_text: "OK",
        size: "md",
        min: null,
        max: null,
      },
      ...config
    });

    const mode = this.get_config("mode");
    if (!CN_common.is_datetime_type(mode, "date")) {
      throw new Error(`CN_modal_datetime: ${mode} is not supported`);
    }

    if (null === this.get_config("value")) this.set_config("value", new Date());
    if (!CN_common.is_date(this.get_config("value"))) {
      throw new Error("Non-date value passed to CN_modal_datetime");
    }

    // enforce min/max values
    const min = this.get_config("min");
    const max = this.get_config("max");
    if (min && min > this.get_config("value")) {
      this.set_config("value", CN_common.clone(min));
    } else if (max && max < this.get_config("value")) {
      this.set_config("value", CN_common.clone(max));
    }

    // set irrelevant time components to 0
    const value = this.get_config("value");
    if (["date", "dob", "dod"].includes(mode)) {
      value.setHours(0);
      value.setMinutes(0);
      value.setSeconds(0);
    } else if ("datetime" === mode) {
      value.setSeconds(0);
    }
    value.setMilliseconds(0);

    // add the resolve buttons
    this.add_resolve_button("light", this.get_config("cancel_text"), () => this._resolve(undefined));
    this.add_resolve_button("success", this.get_config("ok_text"), async () => this._resolve(this.get_date()));
  }

  /**
   * ADD DOCS
   */
  get_date() {
    const date = this.#date_picker.get_date();
    if (this.#time_picker) {
      const time = this.#time_picker.get_time();
      date.setHours(time.hours);
      date.setMinutes(time.minutes);
      date.setSeconds(time.seconds);
    } else {
      date.setHours(0);
      date.setMinutes(0);
      date.setSeconds(0);
    }
    date.setMilliseconds(0);

    return date;
  }

  /**
   * Handle now button click
   * @param {*} event
   */
  #on_now_clicked(event) {
    if (this.#time_picker) this.#time_picker.set_to_now();
    this.#date_picker.set_to_today();
  }

  /**
   * Handle Today button click
   * @param {*} event
   */
  #on_today_clicked(event) {
    this.#date_picker.set_to_today();
  }

  /**
   * Handle Today button click
   * @param {*} event
   */
  #on_empty_clicked(event) {
    this._resolve(null);
  }

  /**
   * ADD DOCS
   */
  _create_body_element() {
    const body_el = this.constructor.html(`
      <div>
        <div name="date-picker" class="d-flex justify-content-center p-0"></div>
        <div name="time-picker" class="d-flex justify-content-center p-0"></div>
      </div>
    `);

    const mode = this.get_config("mode");
    const value = this.get_config("value");

    const date_picker_el = body_el.querySelector('[name="date-picker"]');
    this.#date_picker = new CN_element_date_picker(date_picker_el, {
      date: value,
      is_restricted: (date) => {
        const min = CN_common.clone(this.get_config("min"));
        if (CN_common.is_date(min)) {
          min.setHours(0);
          min.setMinutes(0);
          min.setSeconds(0);
          min.setMilliseconds(0);
        }

        const max = CN_common.clone(this.get_config("max"));
        if (CN_common.is_date(max)) {
          max.setHours(23);
          max.setMinutes(59);
          max.setSeconds(59);
          max.setMilliseconds(0);
        }

        return (CN_common.is_date(min) && date < min) || (CN_common.is_date(max) && date > max);
      },
      on_date_selected: (date) => {
        // run the time picker's time change function (incase it is now out of bounds)
        if (this.#time_picker) this.#time_picker.on_time_change();
      },
    });
    date_picker_el.append(this.#date_picker.get_element());

    if (["datetime", "datetimesecond"].includes(mode)) {
      const time_picker_el = body_el.querySelector('[name="time-picker"]');
      this.#time_picker = new CN_element_time_picker(time_picker_el, {
        hours: value.getHours(),
        minutes: value.getMinutes(),
        seconds: value.getSeconds(),
        show_seconds: "second" == mode.substr(-6),
        get_min: () => {
          const min = this.get_config("min");
          return CN_common.is_date(min) && min > this.get_date() ? min : null;
        },
        get_max: () => {
          const max = this.get_config("max");
          return CN_common.is_date(max) && max < this.get_date() ? max : null;
        },
      });
      time_picker_el.append(this.#time_picker.get_element());
    }

    return body_el;
  }

  /**
   * ADD DOCS
   */
  _create_footer_element() {
    const footer_el = super._create_footer_element();

    const btn_group_el = footer_el.querySelector("div[name=left-btn-group]");

    const now_btn_el = this.constructor.html('<button name="now" class="btn btn-light">Now</button>');
    now_btn_el.addEventListener("click", this.#on_now_clicked.bind(this));
    btn_group_el.append(now_btn_el);

    const today_btn_el = this.constructor.html('<button name="today" class="btn btn-light">Today</button>');
    today_btn_el.addEventListener("click", this.#on_today_clicked.bind(this));
    btn_group_el.append(today_btn_el);

    const empty_btn_el = this.constructor.html('<button name="empty" class="btn btn-light">Empty</button>');
    empty_btn_el.addEventListener("click", this.#on_empty_clicked.bind(this));
    btn_group_el.append(empty_btn_el);

    return footer_el;
  }
}
