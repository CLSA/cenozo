import { CN_base_object } from "../base_object.mjs";
import CN_element from "../element.mjs";
import CN_calendar from "./calendar.mjs";
import CN_time_picker from "./time_picker.mjs";
import CN_session from "../session.mjs";

export const DATE_TYPES = {
  DATE: "date",
  DATETIME: "datetime",
  DATETIMESEC: "datetimesecond",
  DOB: "dob",
  DOD: "dod"
};

export default class CN_datetime_modal extends CN_base_object {
  #el;
  #date_parts;
  #mode = "datetime";

  #bootstrap_modal;
  #calendar;
  #time_picker;

  #options;

  #resolve;
  #reject;

  /**
   * date - the date to initialize the calendar with (date selected)
   * mode - date type (date, datetime, datetimesec, dob, dod)
   * @param { object } options
   */
  constructor(date, mode, options = {
    title: "Calendar",
    cancel_text: "Cancel",
    ok_text: "OK"
  }) {
    super();

    if (mode == null || !Object.values(DATE_TYPES).includes(mode))
      throw new Error(`CN_datetime_picker: ${mode} is not supported`);

    if (date == null || (typeof(date) == "string" && date === "")) {
      this.#date_parts = this.#extract_date_parts(new Date().toISOString(), CN_session.get_timezone());
    } else if (typeof(date) === "string" && date !== "") {
      this.#date_parts = this.#extract_date_parts(new Date(date).toISOString(), 'UTC');
    } else {
      this.#date_parts = this.#extract_date_parts(date, 'UTC');
    }

    this.#mode = mode;

    if (this.#mode === "dob" || this.#mode === "dod") {
      this.#date_parts.hour = 0;
      this.#date_parts.minute = 0;
      this.#date_parts.second = 0;
    }

    if (this.#mode === "datetime") {
      this.#date_parts.second = 0;
    }

    this.#options = options;
  }



  /**
   * Opens the modal and returns a promise for async/await
   */
  async open() {
    return new Promise((resolve, reject) => {
      this.#resolve = resolve;
      this.#reject = reject;

      this.#render();
      this.#bootstrap_modal.show();
    })
  }

  /**
   * Hides the modal
   */
  close() {
    //this.#bootstrap_modal.hide();
    this.#destroy();
  }

  /**
   * Formats the date to YY/MM/DD HH:MM:SS
   * @returns string
   */
  get_date() {
    if (this.#mode === "datetime" || this.#mode === "datetimesecond") {
      this.#date_parts.hour = this.#time_picker.get_hour();
      this.#date_parts.minute = this.#time_picker.get_minute();
      this.#date_parts.second = this.#mode === "datetimesecond" ? this.#time_picker.get_second() : 0;
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
   * Removes the modal from the DOM
   */
  #destroy() {
    const modal = document.getElementById("datepicker-modal");
    if (modal) {
      modal.remove();
      this.#bootstrap_modal.dispose();
    }
  }

  /**
   * Handle now button click
   * @param {*} event
   */
  #on_now_clicked(event) {
    this.#date_parts = this.#extract_date_parts(new Date().toISOString(), CN_session.get_timezone());
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
    this.#date_parts = this.#extract_date_parts(new Date().toISOString(), CN_session.get_timezone());
    this.#date_parts.hour = 0;
    this.#date_parts.minute = 0;
    this.#date_parts.second = 0;

    this.#time_picker.set_hour(this.#date_parts.hour);
    this.#time_picker.set_minute(this.#date_parts.minute);
    this.#time_picker.set_second(this.#date_parts.second);
    this.#time_picker.render();

    this.#calendar.set(this.#date_parts)
  }

  #on_ok_clicked() {
    this.#resolve(this.get_date());
    this.close();
  }

  #on_cancel_clicked() {
    this.#resolve(this.get_date());
    this.close();
  }

  #on_empty_clicked() {
    this.#resolve(null);
    this.close();
  }

  #render() {
    this.#el = CN_element.create_fragment(`
      <div id="datepicker-modal" class="modal fade" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header text-bg-primary fw-bold fs-5">
              <h5 class="modal-title">
                ${this.#options.title}
              </h5>
            </div>
            <div class="modal-body">
              <div name="calendar" class="d-flex justify-content-center p-0"></div>
              <div name="time-picker" class="d-flex justify-content-center p-0 mt-2"></div>
            </div>
            <div class="modal-footer d-flex justify-content-between text-bg-secondary fs-5">
              <div class="btn-group">
                <button name="now" class="btn btn-primary">Now</button>
                <button name="today" class="btn btn-primary">Today</button>
                <button name="empty" class="btn btn-light">Empty</button>
              </div>
              <div class="btn-group">
                <button name="cancel" type="button" class="btn btn-light" data-dismiss="modal">
                  ${this.#options.cancel_text}
                </button>
                <button name="ok" type="button" class="btn btn-primary">
                  ${this.#options.ok_text}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>`
    );

    this.#el.querySelector('[name="now"]')
      .addEventListener("click", this.#on_now_clicked.bind(this));

    this.#el.querySelector('[name="today"]')
      .addEventListener("click", this.#on_today_clicked.bind(this));

    this.#el.querySelector('[name="empty"]')
      .addEventListener("click", this.#on_empty_clicked.bind(this));

    this.#el.querySelector('[name="ok"]')
      .addEventListener("click", this.#on_ok_clicked.bind(this));

    this.#el.querySelector('[name="cancel"]')
      .addEventListener("click", this.#on_cancel_clicked.bind(this));

    this.#bootstrap_modal = new bootstrap.Modal(this.#el);
    this.#calendar = new CN_calendar(
      this.#el.querySelector('[name="calendar"]'),
      this.#date_parts,
      (date) => {
        return (this.#mode === "dob" || this.#mode === "dod") && date.getTime() > Date.now();
      }
    );

    this.#calendar.add_listener(this);

    if (this.#mode === "datetime" || this.#mode === "datetimesecond") {
      this.#time_picker = new CN_time_picker(
        this.#el.querySelector('[name="time-picker"]'),
        this.#date_parts.hour,
        this.#date_parts.minute,
        this.#date_parts.second,
        { show_seconds: this.#mode === "datetimesecond" }
      );
    }
  }
}