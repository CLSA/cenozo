import CN_common from "../common.mjs"

import { CN_month_picker } from "./month_picker.mjs";
import { CN_year_picker } from "./year_picker.mjs";

import { CN_base_element } from "./base_element.mjs";

export class CN_calendar extends CN_base_element {
  #parent_el;
  #el;

  #date_parts;

  #month;
  #year;
  #calendar;

  #previous_btn;
  #next_btn;
  #change_view_btn;

  #mode = "day";

  #month_picker;
  #year_picker;

  #listeners = [];
  #restrict;

  /**
   * Calendar component with multiple views (using month and year picker components)
   *
   * @param { { year: num, month: num, day: num, hour: num, minute: num, second: num } } date_parts
   * Date parts object to initialize the calendar with
   *
   * @param { (date: Date) => boolean } restrict
   * Callback that determines which calendar dates should be disabled, default always returns false
   *
   */
  constructor(date_parts, restrict = () => false) {
    super();

    this.#date_parts = date_parts;
    this.#month = this.#date_parts.month - 1;
    this.#year = this.#date_parts.year;

    this.#calendar = this.#get_calendar(this.#month, this.#year);

    this.#month_picker = new CN_month_picker(this.#parent_el, this.#year);
    this.#month_picker.add_listener(this);

    this.#year_picker = new CN_year_picker(this.#parent_el, this.#year);
    this.#year_picker.add_listener(this);

    this.#restrict = restrict;

    this.render();
  }

  /**
   * Sets the calendar to a given day, must be in "parts" format as returned by the Intl api
   * i.e { day: int, month: int, year: int, hour: int, minute: int, second: int }
   * @param {*} date_parts
   */
  set(date_parts) {
    this.#mode = "day";
    this.#date_parts = date_parts;

    this.#month = this.#date_parts.month - 1;
    this.#year = this.#date_parts.year;

    this.#calendar = this.#get_calendar(this.#month, this.#year);
    this.#month_picker.set_year(this.#year);
    this.#year_picker.set_year(this.#year);

    this.render();
  }

  /**
   * Switches the view to the next month
   */
  next_month() {
    this.#month = this.#month + 1;

    if (this.#month % 12 == 0) {
      this.#month = 0;
      this.#year++;
    }

    this.#calendar = this.#get_calendar(this.#month, this.#year);
    this.render();
  }

  /**
   * Switches the view to the previous month
   */
  previous_month() {
    this.#month -= 1;

    if (this.#month < 0) {
      this.#month = 11;
      this.#year--;
    }

    this.#calendar = this.#get_calendar(this.#month, this.#year);
    this.render();
  }

  /**
   * Adds a listener object to the calendar, the listener must implement handle_date_clicked(date)
   * @param {*} listener
   */
  add_listener(listener) {
    this.#listeners.push(listener);
  }

  /**
   * Returns the number of days in a month & year
   *
   * @param {number} month - 0 indexed
   * @param {number} year
   * @returns
   */
  #get_days_in_month(month, year) {
    return new Date(year, month + 1, 0).getDate();
  }

  /**
   * Returns an array containing all dates for a given month and year
   * @param {number} month - 0 indexed
   * @param {number} year
   * @returns
   */
  #get_calendar(month, year) {
    if (month < 0 || month > 11) throw new Error("Invalid month");
    if (year < 0) throw new Error("Invalid year");

    const calendar = [];
    const days_in_month = this.#get_days_in_month(month, year);
    for (let day = 1; day <= days_in_month; day++) {
      const date = new Date(year, month, day);
      calendar.push(date);
    }
    // get the starting days of the first week from the previous month
    // if the first day doesn't start on a Sunday
    const days_prev = calendar[0].getDay();
    for (let i = 0; i < days_prev; i++) {
      const date = new Date(year, month, -i);
      calendar.unshift(date);
    }
    // fill the calendar so that it always contains 42 days (6 weeks)
    const days_next = 42 - calendar.length;
    for (let i = 0; i < days_next; i++) {
      const date = new Date(year, month + 1, i + 1);
      calendar.push(date);
    }
    return calendar;
  }

  /**
   * Fires an event when a date is clicked.
   * May switch the view if the day belongs to a different month or year
   * @param {Date} date
   */
  on_date_clicked(event, date) {
    if (event.target.getAttribute("disabled") && this.#restrict(date)) {
      return;
    } else if (date.getFullYear() > this.#year) {
      this.next_month();
    } else if (date.getFullYear() < this.#year) {
      this.previous_month();
    } else if (date.getMonth() < this.#month) {
      this.previous_month();
    } else if (date.getMonth() > this.#month) {
      this.next_month();
    }
    this.#listeners.forEach(listener => listener.handle_date_clicked(date));
  }

  /**
   * Handles a month selected event by getting the calendar for that month and switching the view
   * @param {number} month
   */
  on_month_selected(month) {
    this.#month = month;
    this.#mode = "day";
    this.#calendar = this.#get_calendar(this.#month, this.#year);
    this.render();
  }

  /**
   * Handles a year selected event by getting the calendar for that year/month and switching the view
   * @param {number} year
   */
  on_year_selected(year) {
    this.#year = year;
    this.#mode = "month";
    this.#calendar = this.#get_calendar(this.#month, this.#year);
    this.render();
  }

  /**
   * Switches to the "next" view and re-renders
   */
  change_view() {
    if (this.#mode === "day") {
      this.#mode = "month";
    } else if (this.#mode === "month") {
      this.#mode = "year";
    } else if (this.#mode === "year") {
      this.#mode = "day";
    }
    this.render();
  }

  /**
   * Listener for the change of view
   */
  on_view_change() {
    this.change_view();
  }

  /**
   * Updates the DOM according to current state
   */
  render() {
    if (this.#mode == "day") {
      this.#render_day();
    } else if (this.#mode == "month") {
      this.#render_month()
    } else if (this.#mode == "year") {
      this.#render_decade();
    } else {
      throw new Error(`Unsupported mode: ${this.#mode}`);
    }
  }

  #render_day() {
    this.#parent_el.innerHTML = "";

    this.#el = this.constructor.html(`
      <div class="row w-100 p-2">
        <button name="prev_month" class="btn btn-sm btn-primary col-1">
          <i class="bi bi-caret-left-fill"></i>
        </button>
        <button name="change_view" class="btn btn-light rounded-0 fw-bold text-center col-10 m-0">
          ${CN_common.get_month(this.#month)} ${this.#year}
        </button>
        <button name="next_month" class="btn btn-sm btn-primary col-1">
          <i class="bi bi-caret-right-fill"></i>
        </button>
      </div>
    `);

    this.#previous_btn = this.#el.querySelector('[name="prev_month"]');
    this.#previous_btn.addEventListener("click", this.previous_month.bind(this));

    this.#next_btn = this.#el.querySelector('[name="next_month"]');
    this.#next_btn.addEventListener("click", this.next_month.bind(this));

    this.#change_view_btn = this.#el.querySelector('[name="change_view"]');
    this.#change_view_btn.addEventListener('click', this.change_view.bind(this));

    const calendar_el = this.constructor.html(`
      <table class="table table-responsive">
        <thead>
          <tr>
            <th style="width: 14%" class="text-center" scope="col">Sun</th>
            <th style="width: 14%" class="text-center" scope="col">Mon</th>
            <th style="width: 14%" class="text-center" scope="col">Tue</th>
            <th style="width: 14%" class="text-center" scope="col">Wed</th>
            <th style="width: 14%" class="text-center" scope="col">Thu</th>
            <th style="width: 14%" class="text-center" scope="col">Fri</th>
            <th style="width: 14%" class="text-center" scope="col">Sat</th>
          </tr>
        </thead>
      </table>
    `);

    let tr = null;
    for (let i = 0; i < this.#calendar.length; i++) {
      if (i % 7 == 0) {
        tr = this.constructor.html("<tr></tr>");
        calendar_el.appendChild(tr);
      }

      const date = this.#calendar[i];
      const disabled = this.#should_disable_date(date);
      const date_btn = this.constructor.html(`
        <td class="text-center p-0">
          <button class="
            btn btn-light col-12 rounded-0
            ${disabled ? "disabled" : ""}"
          >
            ${date.getDate()}
          </button>
        </td>
      `);

      date_btn.setAttribute("disabled", disabled);

      if (this.#is_today(date)) {
        date_btn.querySelector("button").classList.remove("btn-light");
        date_btn.querySelector("button").classList.add("btn-primary");
      }

      date_btn.addEventListener("click", (event) => this.on_date_clicked(event, date));
      tr.appendChild(date_btn);
    }

    this.#el.appendChild(calendar_el);
    this.#parent_el.appendChild(this.#el);
  }

  /**
   * Checks if the calendar date matches the date selected by the user (for highlighting)
   * @param {Date} date
   * @returns
   */
  #is_today(date) {
    return (
      (this.#date_parts.month - 1) === date.getMonth() &&
      this.#date_parts.day === date.getDate() &&
      this.#date_parts.year === date.getFullYear()
    );
  }

  /**
   * Checks if the date should be disabled (belongs to other month, or is restricted by the user
   * provided callback
   * @param {Date} date
   * @returns boolean
   */
  #should_disable_date(date) {
    return (date.getMonth() < this.#month) || (date.getMonth() > this.#month) || this.#restrict(date);
  }

  #render_month() {
    this.#month_picker.set_year(this.#year);
    this.#month_picker.render();
  }

  #render_decade() {
    this.#year_picker.render();
  }
}
