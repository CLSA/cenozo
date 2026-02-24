import CN_common from "../../common.mjs";
import CN_session from "../../session.mjs";

import { CN_base_modal } from "./base_modal.mjs";
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
      },
      ...config
    });

    const mode = this.get_config("mode");
    if (!CN_common.is_datetime_type(mode, "date"))
      throw new Error(`CN_modal_datetime: ${mode} is not supported`);

    let value = this.get_config("value");
    if (CN_common.is_string(value)) {
      value = new Date(value);
      this.set_config("value", value);
    }

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
    this.add_resolve_button("success", this.get_config("ok_text"), async () => {
      const date = this.#date_picker.get_date();
      const time = this.#time_picker.get_time();
      date.setHours(time.getHours());
      date.setMinutes(time.getMinutes());
      date.setSeconds(time.getSeconds());
      
      this._resolve(date);
    });
  }

  /**
   * Handle now button click
   * @param {*} event
   */
  #on_now_clicked(event) {
    this.#time_picker.set_to_now();
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
    // TODO: implement
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

    const date_picker_el = body_el.querySelector('[name="date-picker"]');
    this.#date_picker = new CN_element_date_picker(date_picker_el);
    date_picker_el.append(this.#date_picker.get_element());

    const mode = this.get_config("mode");
    if (["datetime", "datetimesecond"].includes(mode)) {
      const time_picker_el = body_el.querySelector('[name="time-picker"]');
      this.#time_picker = new CN_element_time_picker(time_picker_el, {
        show_seconds: "second" == mode.substr(-6),
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
