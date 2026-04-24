import { CN_base_element } from "./base_element.mjs";
import { CN_common } from "../common.mjs"

export class CN_element_calendar extends CN_base_element {
  #mode = "month";
  #date;
  #month;
  #year;
  #table_el;
  #mode_btn_el;

  constructor(parent_el, config = {}) {
    if (!CN_common.is_object(config)) {
      throw new Error("Non-object config argument passed to CN_element_calendar constructor");
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
    this.#date = CN_common.clone(date);
    this.#month = this.#date.getMonth();
    this.#year = this.#date.getFullYear();
  }

  /**
   * ADD DOCS
   */
  move_date(forward, unit, fast) {
    if ("day" == unit && !fast) {
      // move one day
      const d = CN_common.clone(this.#date);
      d.setDate(d.getDate() + (forward ? 1 : -1));
      this.set_date(d);
    } else if (("week" == unit && !fast) || ("day" == unit && fast)) {
      // move one week
      const d = CN_common.clone(this.#date);
      d.setDate(d.getDate() + (forward ? 7 : -7));
      this.set_date(d);
    } else if (("month" == unit && !fast) || ("week" == unit && fast)) {
      // move one month
      if (forward) {
        this.#month += 1;
        if (12 == this.#month) {
          this.#month = 0;
          this.#year++;
        }
      } else {
        this.#month -= 1;
        if (-1 == this.#month) {
          this.#month = 11;
          this.#year--;
        }
      }
    } else if ("month" == unit && fast) {
      // move one year
      if (forward) {
        this.#year++;
      } else {
        this.#year--;
      }
    }
  }

  /**
   * Updates the DOM according to current state
   */
  update_element() {
    super.update_element();

    const el = this.get_element();
    el.querySelectorAll("li a").forEach(a_el => {
      if (a_el.getAttribute("name") == this.#mode) {
        this.constructor.set_disabled(a_el, true);
      } else {
        this.constructor.set_disabled(a_el, false);
      }
    });
    if ("month" == this.#mode) {
      this.#display_month();
    } else if ("week" == this.#mode) {
      this.#display_week()
    } else if ("day" == this.#mode) {
      this.#display_day();
    } else {
      throw new Error(`Unsupported mode: ${this.#mode}`);
    }
  }

  /**
   * Updates the DOM according to current state
   */
  _create_element() {
    const el = this.constructor.html(`
      <div class="row">
        <div class="btn-group px-0">
          <button type="button" name="previous-fast" class="btn btn-outline-primary rounded-0 col-1">
            <i class="bi bi-rewind-fill"></i>
          </button>
          <button type="button" name="previous" class="btn btn-outline-primary col-1" style="rotate: 180deg">
            <i class="bi bi-play-fill"></i>
          </button>
          <div class="dropdown col-8 mx-1">
            <button
              name="mode"
              type="button"
              class="btn btn-light dropdown-toggle rounded-0 w-100 fw-bold"
              data-bs-toggle="dropdown"
              aria-expended="false"
            ></button>
            <ul class="dropdown-menu w-100">
              <li><a href="#" name="month" class="dropdown-item text-center fw-bold">Show Month</a></li>
              <li><a href="#" name="week" class="dropdown-item text-center fw-bold">Show Week</a></li>
              <li><a href="#" name="day" class="dropdown-item text-center fw-bold">Show Day</a></li>
            </ul>
          </div>
          <button type="button" name="next" class="btn btn-outline-primary col-1">
            <i class="bi bi-play-fill"></i>
          </button>
          <button type="button" name="next-fast" class="btn btn-outline-primary rounded-0 col-1">
            <i class="bi bi-fast-forward-fill"></i>
          </button>
        </div>
        <table class="table table-bordered"></table>
      </div>
    `);

    this.#table_el = el.querySelector("table");
    this.#mode_btn_el = el.querySelector("button[name=mode]");

    // wire up the buttons
    el.querySelector("button[name=previous-fast]").addEventListener("click", () => {
      this.move_date(false, this.#mode, true);
      this.update_element();
    });

    el.querySelector("button[name=previous]").addEventListener("click", () => {
      this.move_date(false, this.#mode, false);
      this.update_element();
    });

    el.querySelector("button[name=next]").addEventListener("click", () => {
      this.move_date(true, this.#mode, false);
      this.update_element();
    });

    el.querySelector("button[name=next-fast]").addEventListener("click", () => {
      this.move_date(true, this.#mode, true);
      this.update_element();
    });

    el.querySelectorAll("li a").forEach(a_el => {
      a_el.addEventListener("click", () => {
        this.#mode = a_el.getAttribute("name");
        this.update_element();
      });
    });

    return el;
  }

  /**
   * ADD DOCS
   */
  #display_month() {
    // set the mode button text
    this.#mode_btn_el.innerHTML = [CN_common.get_month(this.#month), this.#year].join(" ");

    this.#table_el.replaceChildren(this.constructor.html(`
      <thead>
        <tr>
          ${CN_common.get_weekday(null, "en", "short").map(
            day => `<th width="14.286%" class="text-center" scope="col">${day}</th>`
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

    const tbody_el = this.constructor.html('<tbody></tbody>');
    this.#table_el.append(tbody_el);
    let tr_el = null;
    day_list.forEach((date, index) => {
      if (0 == index % 7) {
        tr_el = this.constructor.html("<tr></tr>");
        tbody_el.append(tr_el);
      }

      const year = date.getFullYear();
      const month = date.getMonth();
      const day = date.getDate();
      const restricted = this.get_config("is_restricted")(date);
      const date_td_el = this.constructor.html('<td class="p-0 pe-1"></td>');
      const date_div_el = this.constructor.html(`
        <div class="w-100 p-0" style="min-height: 5em">
          <div class="text-end">${day}</div>
          <div class="w-100">
          </div>
        </div>
      `);
      date_td_el.append(date_div_el);
      if (restricted || month != this.#month) date_td_el.classList.add("table-light");

      // highlight today's date
      const today = new Date();
      if (today.getFullYear() === year && today.getMonth() === month && today.getDate() === day) {
        date_td_el.classList.remove("table-light");
        date_td_el.classList.add("table-warning");
      }

      date_td_el.addEventListener("click", (event) => {
        if (year < this.#year || month < this.#month) {
          this.move_date(false, "month", false);
        } else if (year > this.#year || month > this.#month) {
          this.move_date(true, "month", false);
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
  #display_week() {
    const jan_one = new Date(this.#date.getFullYear(), 0, 1);
    const week = Math.ceil((((this.#date - jan_one) / 86400000) + jan_one.getDay() + 1) / 7);

    // set the mode button text
    this.#mode_btn_el.innerHTML = `${this.#year} (week ${week})`;

    // backup the current day to the start of the week (Sunday)
    const d = CN_common.clone(this.#date);
    d.setDate(d.getDate() - this.#date.getDay());

    const date_index = this.#date.getDay();
    this.#table_el.replaceChildren(this.constructor.html(`
      <thead>
        <tr>
          <th scope="col"></th>
          ${CN_common.get_weekday(null, "en", "short").map((day, index) => {
            // need to add (Mon/Day) after ${day}
            const title = `${CN_common.get_month(d.getMonth(), "en", "short")} ${d.getDate()}`;
            d.setDate(d.getDate() + 1);
            return `<th width="14.286%" class="text-center" scope="col">${day} (${title})</th>`;
          }).join("\n")}
        </tr>
      </thead>
    `));

    const tbody_el = this.constructor.html("<tbody></tbody>");
    this.#table_el.append(tbody_el);
    /*
    CN_common.get_list_of_numbers(10).forEach(index =>
    this.#table_el.append(this.constructor.html(`
      <tbody>
        <tr>
          ${CN_common.get_weekday(null, "en", "short").map(day => `
            <td class="p-0 pe-1">
              <div class="w-100 p-0" style="min-height: 30em">
              </div>
            </td>
          `).join("\n")}
        </tr>
      </tbody>
    `));
    */
  }

  /**
   * ADD DOCS
   */
  #display_day() {
    /*
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
    */
  }
}
