import CN_common from "../../common.mjs";
import CN_session from "../../session.mjs";

import CN_calendar from "../../date/calendar.mjs";
import CN_time_picker from "../../date/time_picker.mjs";

import { CN_base_modal } from "./base_modal.mjs";

export class CN_modal_datetime extends CN_base_modal {
  #el;
  #date_parts;
  #mode = "datetime";

  #bootstrap_modal;
  #calendar;
  #time_picker;

  #resolve;
  #reject;

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
      },
      ...config
    });

    const mode = this.get_config("mode");
    if (!CN_common.is_datetime_type(mode, "date"))
      throw new Error(`CN_modal_datetime: ${mode} is not supported`);

    const value = this.get_config("value");
    if (["", null].includes(value)) {
      this.#date_parts = this.#extract_date_parts(new Date().toISOString(), CN_session.data.user.timezone);
    } else if (CN_common.is_string(value)) {
      this.#date_parts = this.#extract_date_parts(new Date(value).toISOString(), 'UTC');
    } else if (CN_common.is_date(value)) {
      this.#date_parts = this.#extract_date_parts(value, 'UTC');
    }

    if (["dob", "dod"].includes(mode)) {
      this.#date_parts.hour = 0;
      this.#date_parts.minute = 0;
      this.#date_parts.second = 0;
    } else if ("datetime" === mode) {
      this.#date_parts.second = 0;
    }

    // add the resolve buttons
    this.add_resolve_button("light", this.get_config("cancel_text"), () => this._resolve(undefined));
    this.add_resolve_button("success", this.get_config("ok_text"), async () => {
      this._resolve(this.get_date());
    });
  }

  /**
   * Formats the date to YY/MM/DD HH:MM:SS
   * @returns string
   */
  get_date() {
    const mode = this.get_config("mode");
    if (["datetime", "datetimesecond"].includes(mode)) {
      this.#date_parts.hour = this.#time_picker.get_hour();
      this.#date_parts.minute = this.#time_picker.get_minute();
      this.#date_parts.second = mode === "datetimesecond" ? this.#time_picker.get_second() : 0;
    } else {
      this.#date_parts.hour = 0;
      this.#date_parts.minute = 0;
      this.#date_parts.second = 0;
    }
    return this.#assemble_date_parts(this.#date_parts);
  }

  /**
   * Handle a date click event from the calendar
   * @param {Date} date
   */
  handle_date_clicked(date) {
    this.#date_parts = this.#extract_date_parts(date.toISOString());
    this.#calendar.set(this.#date_parts);
  }

  /**
   * Disassembles a date string into its parts using Intl API
   *
   * @param {string} date_string
   * @param {string} time_zone
   * @returns
   */
  #extract_date_parts(date_string, time_zone) {
    const date = new Date(date_string);

    const formatter = new Intl.DateTimeFormat('en-CA', {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZone: time_zone
    });

    const parts = formatter.formatToParts(date);

    return parts.reduce((acc, part) => {
      if (part.type !== "literal") {
        acc[part.type] = parseInt(part.value);
      }
      return acc;
    }, {});
  }

  /**
   * Returns a date string by converting the parts object into a date object
   * @param {object} parts
   * @returns
   */
  #assemble_date_parts(parts) {
    const date = new Date(Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second
    ));
    return date.toISOString();
  }

  /**
   * Handle now button click
   * @param {*} event
   */
  #on_now_clicked(event) {
    this.#date_parts = this.#extract_date_parts(new Date().toISOString(), CN_session.data.user.timezone);
    this.#time_picker.set_hour(this.#date_parts.hour);
    this.#time_picker.set_minute(this.#date_parts.minute);
    this.#time_picker.set_second(this.#date_parts.second);
    this.#time_picker.render();

    this.#calendar.set(this.#date_parts);
  }

  /**
   * Handle Today button click
   * @param {*} event
   */
  #on_today_clicked(event) {
    this.#date_parts = this.#extract_date_parts(new Date().toISOString(), CN_session.data.user.timezone);
    this.#date_parts.hour = 0;
    this.#date_parts.minute = 0;
    this.#date_parts.second = 0;

    this.#time_picker.set_hour(this.#date_parts.hour);
    this.#time_picker.set_minute(this.#date_parts.minute);
    this.#time_picker.set_second(this.#date_parts.second);
    this.#time_picker.render();

    this.#calendar.set(this.#date_parts)
  }

  /**
   * Handle Today button click
   * @param {*} event
   */
  #on_empty_clicked(event) {
    console.log("TODO: implement");
  }

  /**
   * ADD DOCS
   */
  _create_body_element() {
    const body_el = this.constructor.html(`
      <div>
        <div name="calendar" class="d-flex justify-content-center p-0"></div>
        <div name="time-picker" class="d-flex justify-content-center p-0 mt-2"></div>
      </div>
    `);

    this.#bootstrap_modal = new bootstrap.Modal(body_el);
    this.#calendar = new CN_calendar(
      body_el.querySelector('[name="calendar"]'),
      this.#date_parts,
      (date) => {
        return ["dob", "dod"].includes(this.get_config("mode")) && date.getTime() > Date.now();
      }
    );

    this.#calendar.add_listener(this);

    const mode = this.get_config("mode");
    if (["datetime", "datetimesecond"].includes(mode)) {
      this.#time_picker = new CN_time_picker(
        body_el.querySelector('[name="time-picker"]'),
        this.#date_parts.hour,
        this.#date_parts.minute,
        this.#date_parts.second,
        { show_seconds: "datetimesecond" === mode }
      );
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
