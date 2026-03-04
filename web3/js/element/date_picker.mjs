import { CN_common } from "../common.mjs"

import { CN_base_element } from "./base_element.mjs";

export class CN_element_date_picker extends CN_base_element {
  #mode = "day";
  #date;
  #month;
  #year;
  #start_year;
  #year_range = 20;
  #table_el;
  #previous_btn_el;
  #mode_btn_el;
  #next_btn_el;
  #previous_listeners;
  #next_listeners;

  constructor(parent_el, config = {}) {
    if (!CN_common.is_object(config)) {
      throw new Error("Non-object config argument passed to CN_element_date_picker contructor");
    }

    super(parent_el, {
      ...{
        // default config
        is_restricted: (date) => false,
        date: null,
        on_date_selected: (date) => {},
      },
      ...config
    });

    // create listeners for all previous/next buttons
    this.#previous_listeners = {
      day: () => {
        this.#month -= 1;
        if (this.#month < 0) {
          this.#month = 11;
          this.#year--;
        }
        this.update_element();
      },
      month: () => {
        this.#year -= 1;
        this.update_element();
      },
      year: () => {
        this.#start_year -= this.#year_range;
        this.update_element();
      },
    };

    this.#next_listeners = {
      day: () => {
        this.#month = this.#month + 1;
        if (this.#month % 12 == 0) {
          this.#month = 0;
          this.#year++;
        }
        this.update_element();
      },
      month: () => {
        this.#year += 1;
        this.update_element();
      },
      year: () => {
        this.#start_year += this.#year_range;
        this.update_element();
      },
    };

    const date = this.get_config("date");
    this.set_date(CN_common.is_date(date) ? date : new Date());
  }

  /**
   * ADD DOCS
   */
  get_date() {
    return this.#date;
  }

  /**
   * Sets the calendar to a given day
   * @param Date date
   */
  set_date(date) {
    this.#mode = "day";
    this.#date = CN_common.clone(date);
    this.#month = this.#date.getMonth();
    this.#year = this.#date.getFullYear();
    this.#start_year = Math.floor(this.#year / this.#year_range) * this.#year_range;
  }

  set_to_today() {
    this.set_date(new Date());
    this.update_element();
  }

  /**
   * Updates the DOM according to current state
   */
  update_element() {
    super.update_element();

    // remove all button events and re-add the day listeners
    for (const name in this.#previous_listeners) {
      const listener = this.#previous_listeners[name];
      this.#previous_btn_el.removeEventListener("click", listener);
      if (name == this.#mode) this.#previous_btn_el.addEventListener("click", listener);
    }

    for (const name in this.#next_listeners) {
      const listener = this.#next_listeners[name];
      this.#next_btn_el.removeEventListener("click", listener);
      if (name == this.#mode) this.#next_btn_el.addEventListener("click", listener);
    }

    if (this.#mode == "day") {
      this.#display_day();
    } else if (this.#mode == "month") {
      this.#display_month()
    } else if (this.#mode == "year") {
      this.#display_year();
    } else {
      throw new Error(`Unsupported mode: ${this.#mode}`);
    }
  }

  /**
   * Updates the DOM according to current state
   */
  _create_element() {
    const el = this.constructor.html(`
      <div class="row w-100">
        <button name="previous" class="btn btn-sm btn-primary col-1">
          <i class="bi bi-caret-left-fill"></i>
        </button>
        <button name="mode" class="btn btn-light rounded-0 fw-bold text-center col-10 m-0"></button>
        <button name="next" class="btn btn-sm btn-primary col-1">
          <i class="bi bi-caret-right-fill"></i>
        </button>
        <table class="table table-responsive"></table>
      </div>
    `);

    this.#table_el = el.querySelector("table");
    this.#previous_btn_el = el.querySelector("button[name=previous]");
    this.#mode_btn_el = el.querySelector("button[name=mode]");
    this.#next_btn_el = el.querySelector("button[name=next]");
    el.querySelector("button[name=mode]").addEventListener("click", () => {
      if (this.#mode === "day") {
        this.#mode = "month";
      } else if (this.#mode === "month") {
        this.#mode = "year";
      } else if (this.#mode === "year") {
        this.#mode = "day";
      }
      this.update_element();
    });

    return el;
  }

  /**
   * ADD DOCS
   */
  #display_day() {
    // set the mode button text
    this.#mode_btn_el.innerHTML = [CN_common.get_month(this.#month), this.#year].join(" ");

    this.#table_el.innerHTML = "";
    this.#table_el.append(this.constructor.html(`
      <thead>
        <tr>
          ${CN_common.get_weekday(null, "en", "short").map(
            day => `<th class="text-center" scope="col">${day}</th>`
          ).join("\n")}
        </tr>
      </thead>
    `));

    // get a list of all days in the current month
    const day_list = [];
    const days_in_month = new Date(this.#year, this.#month + 1, 0).getDate();
    for (let day = 1; day <= days_in_month; day++) {
      day_list.push(new Date(this.#year, this.#month, day));
    }

    // get the starting days of the first week from the previous month
    let days_prev = day_list[0].getDay();
    // if the first day starts on a Sunday then add the whole week
    if (0 == days_prev) days_prev = 7;
    for (let i = 0; i < days_prev; i++) {
      day_list.unshift(new Date(this.#year, this.#month, -i));
    }
    // fill the day_list so that it always contains 42 days (6 weeks)
    const days_next = 42 - day_list.length;
    for (let i = 0; i < days_next; i++) {
      day_list.push(new Date(this.#year, this.#month + 1, i + 1));
    }

    let tr_el = null;
    day_list.forEach((date, index) => {
      if (0 == index % 7) {
        tr_el = this.constructor.html("<tr></tr>");
        this.#table_el.append(tr_el);
      }

      const year = date.getFullYear();
      const month = date.getMonth();
      const day = date.getDate();
      const restricted = this.get_config("is_restricted")(date);
      const date_td_el = this.constructor.html('<td class="text-center p-0"></td>');
      const date_btn_el = this.constructor.html(`
        <button
          class="btn btn-light w-100 rounded-0 ${month != this.#month || restricted ? "disabled" : ""}"
        >${day}</button>
      `);
      date_td_el.append(date_btn_el);
      if (restricted) date_btn_el.setAttribute("disabled", true);

      // highlight if the calendar date matches the date selected by the user
      if (
        this.#date.getFullYear() === year &&
        this.#date.getMonth() === month &&
        this.#date.getDate() === day
      ) {
        date_btn_el.classList.remove("btn-light");
        date_btn_el.classList.add("btn-primary");
      }

      date_td_el.addEventListener("click", (event) => {
        if (year < this.#year || month < this.#month) {
          this.#previous_listeners.day();
        } else if (year > this.#year || month > this.#month) {
          this.#next_listeners.day();
        }
        if (!restricted) this.set_date(date);
        this.update_element();

        // call the date selected listener
        if (!restricted) this.get_config("on_date_selected")(this.#date);
      });

      tr_el.append(date_td_el);
    });
  }

  /**
   * ADD DOCS
   */
  #display_month() {
    // set the mode button text
    this.#mode_btn_el.innerHTML = this.#year;

    this.#table_el.innerHTML = "";
    this.#table_el.append(this.constructor.html(`
      <thead>
        <tr>
          <th class="text-center" scope="col"></th>
          <th class="text-center" scope="col"></th>
          <th class="text-center" scope="col"></th>
        </tr>
      </thead>
    `));

    // get a list of all months
    const month_list = CN_common.get_month();

    let tr_el = null;
    month_list.forEach((month, index) => {
      if (index % 3 == 0) {
        tr_el = this.constructor.html("<tr></tr>");
        this.#table_el.append(tr_el);
      }

      const month_btn = this.constructor.html(`
        <td class="text-center p-0">
          <button class="btn btn-light w-100 rounded-0">${month}</button>
        </td>
      `);

      month_btn.addEventListener("click", () => {
        this.#mode = "day";
        this.#month = index;
        this.update_element();
      });

      tr_el.append(month_btn);
    });
  }

  /**
   * ADD DOCS
   */
  #display_year() {
    // set the mode button text
    this.#mode_btn_el.innerHTML = `${this.#start_year} - ${this.#start_year + this.#year_range - 1}`;

    this.#table_el.innerHTML = "";
    this.#table_el.append(this.constructor.html(`
      <thead>
        <tr>
          <th class="text-center" scope="col"></th>
          <th class="text-center" scope="col"></th>
          <th class="text-center" scope="col"></th>
          <th class="text-center" scope="col"></th>
          <th class="text-center" scope="col"></th>
        </tr>
      </thead>
    `));

    // loop through all year ranges
    for (let row = this.#start_year; row < this.#start_year + this.#year_range; row += 5) {
      const tr_el = this.constructor.html("<tr></tr>");
      for (let col = 0; col < 5; col++) {
        const td_el = this.constructor.html(`<td class="text-center p-0"></td>`);
        const btn_el = this.constructor.html(
          `<button class="btn btn-light col-12 rounded-0" value="${row + col}">${row + col}</button>`
        );
        btn_el.addEventListener("click", () => {
          this.#mode = "month";
          this.#year = row + col;
          this.update_element();
        });
        td_el.append(btn_el);
        tr_el.append(td_el);
      }
      this.#table_el.append(tr_el);
    }
  }
}
