import { CN_base_element } from "./base_element.mjs";
import { CN_common } from "../common.mjs"

export class CN_element_date_picker extends CN_base_element {
  #mode = "day";
  #date;
  #month;
  #year;
  #start_year;
  #year_range = 20;
  #table_el;
  #mode_btn_el;

  constructor(parent_el, config = {}) {
    if (!CN_common.is_object(config)) {
      throw new Error("Non-object config argument passed to CN_element_date_picker constructor");
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

  /**
   * ADD DOCS
   */
  move_date(forward, unit) {
    if (this.#mode == "day") {
      this.#month += forward ? 1 : -1;
      if (0 == this.#month) {
        this.#month = 11;
        this.#year--;
      } else if (12 == this.#month) {
        this.#month = 0;
        this.#year++;
      }
    } else if (this.#mode == "month") {
      this.#year += forward ? 1 : -1;
    } else if (this.#mode == "year") {
      this.#start_year += forward ? this.#year_range : -this.#year_range;
    }
  }

  /**
   * Updates the DOM according to current state
   */
  update_element() {
    super.update_element();

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
        <div class="btn-group px-0">
          <button type="button" name="previous" class="btn btn-sm btn-outline-primary col-1">
            <i class="bi bi-caret-left-fill"></i>
          </button>
          <button type="button" name="mode" class="btn btn-light mx-1 col-10"></button>
          <button type="button" name="next" class="btn btn-sm btn-outline-primary col-1">
            <i class="bi bi-caret-right-fill"></i>
          </button>
        </div>
        <table class="table table-responsive"></table>
      </div>
    `);

    this.#table_el = el.querySelector("table");
    this.#mode_btn_el = el.querySelector("button[name=mode]");

    // wire up the buttons
    this.#mode_btn_el.addEventListener("click", () => {
      if (this.#mode === "day") {
        this.#mode = "month";
      } else if (this.#mode === "month") {
        this.#mode = "year";
      } else if (this.#mode === "year") {
        this.#mode = "day";
      }
      this.update_element();
    });

    el.querySelector("button[name=previous]").addEventListener("click", () => {
      this.move_date(false, this.#mode);
      this.update_element();
    });

    el.querySelector("button[name=next]").addEventListener("click", () => {
      this.move_date(true, this.#mode);
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

    this.#table_el.replaceChildren(this.constructor.html(`
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
      const date_btn_el = this.constructor.html(
        `<button type="button" class="btn btn-light w-100 rounded-0">${day}</button>`
      );
      date_td_el.append(date_btn_el);
      if (restricted || month != this.#month) this.constructor.set_disabled(date_btn_el, true);

      // highlight if the calendar date matches the date selected by the user
      if (
        this.#date.getFullYear() === year &&
        this.#date.getMonth() === month &&
        this.#date.getDate() === day
      ) {
        date_btn_el.classList.remove("btn-light");
        date_btn_el.classList.add("btn-primary");
      }

      if (!restricted) {
        date_td_el.addEventListener("click", (event) => {
          if (year < this.#year || month < this.#month) {
            this.move_date(false, "day");
          } else if (year > this.#year || month > this.#month) {
            this.move_date(true, "day");
          }
          this.set_date(date);
          this.update_element();

          // call the date selected listener
          this.get_config("on_date_selected")(this.#date);
        });
      }

      tr_el.append(date_td_el);
    });
  }

  /**
   * ADD DOCS
   */
  #display_month() {
    // set the mode button text
    this.#mode_btn_el.innerHTML = this.#year;

    this.#table_el.replaceChildren(this.constructor.html(`
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
          <button type="button" class="btn btn-light w-100 rounded-0">${month}</button>
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

    this.#table_el.replaceChildren(this.constructor.html(`
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
          `<button type="button" class="btn btn-light col-12 rounded-0" value="${row + col}">${row + col}</button>`
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
