import { CN_base_element } from "./base_element.mjs";
import { CN_common } from "../common.mjs"

/**
 * @event modechanged: ran when the calendar's mode is changed
 * @event eventsset: ran when the calendar's events are set
 * @event datechanged: ran when the calendar's date is changed
 * @event selectionchanged: run when the selected date span has changed
 */
export class CN_element_calendar extends CN_base_element {
  #mode;
  #date;
  #events = [];

  #table_el;
  #table_cell_list;
  #mode_btn_el;

  #selecting = false;
  #select_x = null;
  #select_y = null;
  #selection_el = null;
  #selected_cell_list = [];
  #pending_animation = false;

  constructor(parent_el, config = {}) {
    if (!CN_common.is_object(config)) {
      throw new Error("Non-object config argument passed to CN_element_calendar constructor");
    }

    super(parent_el, {
      ...{
        // default config
        date: null,
        mode: "month",
        allow_selection: false,
      },
      ...config
    });

    const date = this.get_config("date");
    this.set_date(CN_common.is_date(date) ? date : new Date());
    this.#mode = this.get_config("mode");
  }

  /**
   * ADD DOCS
   */
  get_mode() {
    return this.#mode;
  }

  /**
   * Sets the view mode
   * @param string mode: either "month", "week" or "day"
   */
  set_mode(mode) {
    this.#mode = mode;
    this.update_element();
    this.run_event_listeners("modechanged");
  }

  /**
   * ADD DOCS
   */
  get_events() {
    return this.#events;
  }

  /**
   * ADD DOCS
   */
  set_events(events) {
    // always dispose of all tooltips when changing the events
    this.#events.filter(event => event.tooltip).forEach(event => event.tooltip.dispose());

    // sort the events
    this.#events = events.sort((a,b) => a.date > b.date);

    // determine which events overlap
    let last_event = null, overlap_event = null;
    this.#events.forEach((event, index) => {
      // initialize the selected parameter
      event.selected = false;

      // convert the duration to a number
      event.duration = Number(event.duration);

      event.overlap = null;
      if (null == overlap_event) {
        // there's no overlapping event, so check to see if this event overlaps with the last
        if (null != last_event) {
          const end_date = CN_common.clone(last_event.date);
          end_date.setMinutes(end_date.getMinutes() + last_event.duration);
          if (event.date < end_date) {
            // we've found a new overlap group
            overlap_event = last_event;
            overlap_event.overlap = { index: 0, total: 2 };
            event.overlap = { index: 1, total: 2 };
          }
        }
      } else {
        // there's an overlapping event, so check to see if this event still overlaps with it
        const end_date = CN_common.clone(overlap_event.date);
        end_date.setMinutes(end_date.getMinutes() + overlap_event.duration);
        if (event.date >= end_date) {
          // no longer overlapping
          overlap_event = null;
        } else {
          // add another event to the overlap group
          event.overlap = { ...last_event.overlap };
          event.overlap.index++;

          // now increment the total for all events in the overlap group
          for (let i = 0; i <= event.overlap.index; i++) this.#events[index - i].overlap.total++;
        }
      }
      last_event = event;
    });

    this.update_element();
    this.run_event_listeners("eventschanged");
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
    this.run_event_listeners("datechanged");
  }

  /**
   * ADD DOCS
   */
  move_date(forward, unit, fast) {
    if ("day" == unit && !fast) {
      // move one day
      const date = CN_common.clone(this.#date);
      date.setDate(date.getDate() + (forward ? 1 : -1));
      this.set_date(date);
    } else if (("week" == unit && !fast) || ("day" == unit && fast)) {
      // move one week
      const date = CN_common.clone(this.#date);
      date.setDate(date.getDate() + (forward ? 7 : -7));
      this.set_date(date);
    } else if (("month" == unit && !fast) || ("week" == unit && fast)) {
      // move one month
      const date = CN_common.clone(this.#date);
      const month = this.#date.getMonth() + (forward ? 1 : -1);
      date.setMonth(month);
      const correct_month = 0 > month ? 11 : 11 < month ? 0 : month;

      // backup one day at a time until we're in the correct month
      while (date.getMonth() != correct_month) date.setDate(date.getDate() - 1);
      this.set_date(date);
    } else if ("month" == unit && fast) {
      // move one year
      const date = CN_common.clone(this.#date);
      date.setFullYear(this.#date.getFullYear() + (forward ? 1 : -1));

      // backup one day at a time until we're in the same month
      while (date.getMonth() != this.#date.getMonth()) date.setDate(date.getDate() - 1);
      this.set_date(date);
    }
  }

  /**
   * ADD DOCS
   */
  get_min_date() {
    let date = null;
    if ("month" == this.#mode) {
      const first_day_of_month = new Date(this.#date.getFullYear(), this.#date.getMonth(), 1);
      let days = first_day_of_month.getDay();
      if (0 == days) days = 7;
      date = new Date(this.#date.getFullYear(), this.#date.getMonth(), 1 - days);
    } else if ("week" == this.#mode) {
      date = new Date(
        this.#date.getFullYear(),
        this.#date.getMonth(),
        this.#date.getDate() - this.#date.getDay()
      );
    } else if ("day" == this.#mode) {
      date = CN_common.clone(this.#date);
    }

    if (null != date) {
      date.setHours(0);
      date.setMinutes(0);
      date.setSeconds(0);
      date.setMilliseconds(0);
    }
    return date;
  }

  /**
   * ADD DOCS
   */
  get_max_date() {
    let date = null;
    if ("month" == this.#mode) {
      const first_day_of_month = new Date(this.#date.getFullYear(), this.#date.getMonth(), 1);
      let days = first_day_of_month.getDay();
      if (0 == days) days = 7;

      date = new Date(this.#date.getFullYear(), this.#date.getMonth() + 1, 0);
      days += date.getDate();
      date.setDate(date.getDate() + 43 - days);
    } else if ("week" == this.#mode) {
      date = new Date(
        this.#date.getFullYear(),
        this.#date.getMonth(),
        this.#date.getDate() - this.#date.getDay() + 7
      );
    } else if ("day" == this.#mode) {
      date = new Date(this.#date.getFullYear(), this.#date.getMonth(), this.#date.getDate() + 1);
    }

    if (null != date) {
      date.setHours(0);
      date.setMinutes(0);
      date.setSeconds(0);
      date.setMilliseconds(0);
      date.setSeconds(-1);
    }
    return date;
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
    this.#pending_animation = false;

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
        <table class="table m-0">
          <thead></thead>
          <tbody></tbody>
        </table>
      </div>
    `);

    this.#table_el = el.querySelector("table");
    this.#mode_btn_el = el.querySelector("button[name=mode]");

    // wire up the forward/reverse and mode buttons
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
      a_el.addEventListener("click", () => this.set_mode(a_el.getAttribute("name")));
    });

    // implement the selection box and mouse events
    if (this.get_config("allow_selection")) {
      const tbody_el = this.#table_el.querySelector("tbody");
      this.#selection_el = this.constructor.html('<div class="position-absolute pe-none"></div>');
      document.body.append(this.#selection_el);

      tbody_el.addEventListener("mousedown", (e) => {
        if (0 == e.button) {
          this.#selecting = true;
          this.#select_x = e.clientX;
          this.#select_y = e.clientY;
        }
      });

      tbody_el.addEventListener("mouseup", (e) => {
        if (0 == e.button && this.#selecting) {
          this.#selecting = false;
          this.#select_x = null;
          this.#select_y = null;
          this.#selection_el.style.cssText = "";


          this.run_event_listeners(
            "selectionchanged",
            this.#table_cell_list.filter(el => el.selected).map(el => el.date).sort((a, b) => a > b),
            this.#events.filter(event => event.selected).sort((a, b) => a.date > b.date),
          );
        }
      });

      tbody_el.addEventListener("mouseleave", (e) => {
        if (this.#selecting) {
          this.#selecting = false;
          this.#select_x = null;
          this.#select_y = null;
          this.#selection_el.style.cssText = "";
        }
      });

      tbody_el.addEventListener("mousemove", (e) => {
        if (this.#selecting) {
          if (!this.#pending_animation) {
            this.#pending_animation = true;
            window.requestAnimationFrame(() => {
              // make sure we're still selecting by the time the animation frame is ready
              if (this.#selecting) {
                const bbox = {
                  left: Math.min(this.#select_x, e.clientX),
                  top: Math.min(this.#select_y, e.clientY),
                  right: Math.max(this.#select_x, e.clientX),
                  bottom: Math.max(this.#select_y, e.clientY),
                };

                this.#selection_el.style.cssText = `
                  left: ${bbox.left}px;
                  top: ${bbox.top}px;
                  width: ${bbox.right - bbox.left}px;
                  height: ${bbox.bottom - bbox.top}px;
                  outline: 2px solid rgb(var(--bs-primary-rgb));
                  z-index: 1000;
                `;

                // highlight events under the selection
                let events_selected = false;
                this.#events.forEach(event => {
                  const r = event.element.getBoundingClientRect();
                  if (r.left < bbox.right && r.right > bbox.left && r.top < bbox.bottom && r.bottom > bbox.top) {
                    event.element.classList.remove(`btn-${event.type}`);
                    event.element.classList.add("btn-info");
                    event.selected = true;
                    events_selected = true;
                  } else {
                    event.element.classList.remove("btn-info");
                    event.element.classList.add(`btn-${event.type}`);
                    event.selected = false;
                  }
                });

                // highlight table cells under the selection
                this.#table_cell_list.forEach(el => {
                  if (events_selected) {
                    el.classList.remove("bg-info-subtle");
                    el.selected = false;
                  } else {
                    const r = el.getBoundingClientRect();
                    if (r.left < bbox.right && r.right > bbox.left && r.top < bbox.bottom && r.bottom > bbox.top) {
                      el.classList.add("bg-info-subtle");
                      el.selected = true;
                    } else {
                      el.classList.remove("bg-info-subtle");
                      el.selected = false;
                    }
                  }
                });
              }
              this.#pending_animation = false;
            });
          }
        }
      });
    }

    return el;
  }

  /**
   * ADD DOCS
   */
  #display_month() {
    // rebuild the table cell list
    this.#table_cell_list = [];

    const current_year = this.#date.getFullYear();
    const current_month = this.#date.getMonth();

    // set the mode button text
    this.#mode_btn_el.innerHTML = [CN_common.get_month(current_month), current_year].join(" ");

    this.#table_el.classList.add("table-bordered");
    this.#table_el.querySelector("thead").replaceChildren(this.constructor.html(`
      <tr>
        ${CN_common.get_weekday(null, "en", "short").map(
          day => `<th class="text-bg-secondary text-center" scope="col" width="14.286%">${day}</th>`
        ).join("\n")}
      </tr>
    `));

    // get a list of all days in the current month
    const day_list = [];
    const days_in_month = new Date(current_year, current_month + 1, 0).getDate();
    for (let day = 1; day <= days_in_month; day++) {
      day_list.push(new Date(current_year, current_month, day));
    }

    // get the starting days of the first week from the previous month
    let days_prev = day_list[0].getDay();
    // if the first day starts on a Sunday then add the whole week
    if (0 == days_prev) days_prev = 7;
    for (let i = 0; i < days_prev; i++) {
      day_list.unshift(new Date(current_year, current_month, -i));
    }
    // fill the day_list so that it always contains 42 days (6 weeks)
    const days_next = 42 - day_list.length;
    for (let i = 0; i < days_next; i++) {
      day_list.push(new Date(current_year, current_month + 1, i + 1));
    }

    // fill in each day of the month
    const tbody_el = this.#table_el.querySelector("tbody");
    tbody_el.classList.remove("position-relative");
    tbody_el.innerHTML = "";
    let tr_el = null;
    day_list.forEach((date, index) => {
      if (0 == index % 7) {
        tr_el = this.constructor.html("<tr></tr>");
        tbody_el.append(tr_el);
      }

      const cell_td_el = this.#create_cell_element(date);
      cell_td_el.classList.add("pe-1");
      tr_el.append(cell_td_el);
      const date_div_el = this.constructor.html(`
        <div class="w-100 p-0" style="min-height: 5em">
          <div class="text-end">${date.getDate()}</div>
          <div name="events" class="w-100"></div>
        </div>
      `);
      cell_td_el.append(date_div_el);

      const year = date.getFullYear();
      const month = date.getMonth();
      if (month != current_month) {
        cell_td_el.classList.add("table-light");

        // clicking on days outside of the current month will transition to that month
        cell_td_el.addEventListener("click", (event) => {
          if (year < current_year || month < current_month) {
            this.move_date(false, "month", false);
          } else if (year > current_year || month > current_month) {
            this.move_date(true, "month", false);
          }
          this.update_element();
        });
      }

      // add this day's events
      const events_div_el = date_div_el.querySelector("div[name=events]");
      this.#events.filter(event =>
        event.date.getFullYear() == date.getFullYear() &&
        event.date.getMonth() == date.getMonth() &&
        event.date.getDate() == date.getDate()
      ).forEach(event => events_div_el.append(this.#create_event_element(event)));
    });
  }

  /**
   * ADD DOCS
   */
  #display_week() {
    // rebuild the table cell list
    this.#table_cell_list = [];

    const jan_one = new Date(this.#date.getFullYear(), 0, 1);
    const week = Math.ceil((((this.#date - jan_one) / 86400000) + jan_one.getDay() + 1) / 7);

    // set the mode button text
    this.#mode_btn_el.innerHTML = `${this.#date.getFullYear()} (week ${week})`;

    const date_index = this.#date.getDay();
    this.#table_el.classList.remove("table-bordered");
    const header_tr_el = this.constructor.html(`
      <tr class="border">
        <th class="text-bg-secondary" scope="col" width="2%"></th>
      </tr>
    `);
    this.#table_el.querySelector("thead").replaceChildren(header_tr_el);
    const tbody_el = this.#table_el.querySelector("tbody");
    tbody_el.classList.add("position-relative");
    tbody_el.innerHTML = "";

    // fill in each hour block of the week
    CN_common.get_list_of_numbers(48).forEach(hour_index => {
      // get the date for the start of the week based on the current date (Sunday)
      const date = CN_common.clone(this.#date);
      date.setDate(date.getDate() - this.#date.getDay());
      date.setHours(Math.floor(hour_index/2));
      date.setMinutes(0 == hour_index % 2 ? 0 : 30);
      date.setSeconds(0);

      // add the body rows
      const body_tr_el = this.constructor.html(`
        <tr name="${hour_index}">
          <td
            class="text-bg-secondary px-1 py-0 fw-bold"
            style="background-clip: padding-box; line-height: 29px;"
          >${
            0 == hour_index % 2 ?
            CN_common.format_time(date).replace(/:00/, "").replace(/ (.)\.m\./, "$1") :
            "&nbsp;"
          }</td>
        </tr>
      `);
      tbody_el.append(body_tr_el);

      // go over each day of the week
      CN_common.get_weekday(null, "en", "short").forEach((day, day_index) => {
        // add the header columns
        if (0 == hour_index) {
          header_tr_el.append(this.constructor.html(`
            <th class="text-bg-secondary border text-center" scope="col" width="14%">
              ${day}
              (${CN_common.get_month(date.getMonth(), "en", "short")} ${date.getDate()})
            </th>
          `));
        }

        const cell_td_el = this.#create_cell_element(date);
        cell_td_el.classList.add("border-start");
        cell_td_el.classList.add("border-end");
        if (0 == hour_index % 2) {
          cell_td_el.classList.add("border-top-0");
          cell_td_el.classList.add("border-bottom-0");
        }
        cell_td_el.style["background-clip"] = "padding-box";
        body_tr_el.append(cell_td_el);

        // move to the next day of the week
        date.setDate(date.getDate() + 1);
      });
    });

    // add this week's events
    const min_date = this.get_min_date();
    const max_date = this.get_max_date();
    this.#events
      .filter(event => min_date <= event.date && event.date <= max_date)
      .forEach(event => tbody_el.append(this.#create_event_element(event)));
  }

  /**
   * ADD DOCS
   */
  #display_day() {
    // rebuild the table cell list
    this.#table_cell_list = [];

    // set the mode button text
    this.#mode_btn_el.innerHTML = CN_common.format_datetime(this.#date, "date", true);

    const date_index = this.#date.getDay();
    this.#table_el.classList.remove("table-bordered");
    this.#table_el.querySelector("thead").innerHTML = "";

    const tbody_el = this.#table_el.querySelector("tbody");
    tbody_el.classList.add("position-relative");
    tbody_el.innerHTML = "";

    const date = CN_common.clone(this.#date);

    // fill in each hour block of the day
    CN_common.get_list_of_numbers(48).forEach(hour_index => {
      date.setHours(Math.floor(hour_index/2));
      date.setMinutes(0 == hour_index % 2 ? 0 : 30);
      date.setSeconds(0);

      // add the body rows
      let time_string = "&nbsp;";
      if (0 == hour_index % 2) {
        time_string = CN_common.format_time(date).replace(/:00/, "").replace(/ (.)\.m\./, "$1");
      }
      const body_tr_el = this.constructor.html(`
        <tr>
          <td class="text-bg-secondary px-1 py-0 fw-bold" width="2%">
            ${time_string}
          </td>
        </tr>
      `);
      tbody_el.append(body_tr_el);

      const cell_td_el = this.#create_cell_element(date);
      cell_td_el.setAttribute("width", "98%");
      cell_td_el.classList.add("border-start");
      cell_td_el.classList.add("border-end");
      if (0 == hour_index % 2) {
        cell_td_el.classList.add("border-top-0");
        cell_td_el.classList.add("border-bottom-0");
      }
      cell_td_el.style["background-clip"] = "padding-box";
      body_tr_el.append(cell_td_el);
    });

    // add the day's events
    const min_date = this.get_min_date();
    const max_date = this.get_max_date();
    this.#events
      .filter(event => min_date <= event.date && event.date <= max_date)
      .forEach(event => tbody_el.append(this.#create_event_element(event)));
  }

  /**
   * ADD DOCS
   */
  #create_cell_element(date) {
    const today_string = (new Date()).toDateString();
    const el = this.constructor.html('<td class="p-0"></td>');

    // attach properties to the cell element to track it's date and whether it has been selected
    el.date = CN_common.clone(date);
    el.selected = false;

    // highlight today's date
    if (date.toDateString() == today_string) {
      el.classList.remove("table-light");
      el.classList.add("table-warning");
    }

    // add the cell to the cached cell list for easy access when in selection mode
    this.#table_cell_list.push(el);

    return el;
  }

  /**
   * ADD DOCS
   */
  #create_event_element(event) {
    event.element = this.constructor.html(`
      <button type="button" class="btn btn-sm btn-${event.type} m-0 p-0">
        ${CN_common.format_time(event.date)}: ${event.title}
      </button>
    `);

    if ("month" == this.#mode) {
      event.element.classList.add("w-100");
    } else {
      const time_fraction = (event.date.getHours() + event.date.getMinutes()/60) / 24;
      if ("week" == this.#mode) {
        event.element.style.cssText = `
          top: ${time_fraction * 100}%;
          left: ${
            2.5 +
            event.date.getDay() * 14 +
            (null == event.overlap ?  0 : event.overlap.index * 6.5 / (event.overlap.total - 1))
          }%;
          width: ${null == event.overlap ? 13 : 6.5}%;
          height: ${event.duration * 0.0694333}%;
          outline: 1px solid white;
          z-index: ${null == event.overlap ? 0 : event.overlap.index};
        `;
      } else if ("day" == this.#mode) {
        event.element.style.cssText = `
          top: ${time_fraction * 100}%;
          left: ${3 + (null == event.overlap ?  0 : event.overlap.index * 70 / (event.overlap.total - 1))}%;
          width: ${null == event.overlap ? 96 : 24.5}%;
          height: ${event.duration * 0.0694333}%;
          outline: 1px solid white;
          z-index: ${null == event.overlap ? 0 : event.overlap.index};
        `;
      }

      event.element.classList.add("position-absolute");
      event.element.classList.add(30 >= event.duration ? "badge" : "fw-bold");
      event.element.classList.add("text-wrap");
      event.element.classList.add("m-0");
      event.element.classList.add("p-0");
      event.element.innerHTML = `
        ${CN_common.format_time(event.date)}
        ${20 < event.duration ? "<br/>" : ""}
        ${event.title}
      `;

      // temporarily raise events that the mouse is hovering over
      event.element.addEventListener("mouseenter", () => {
        event.element.style["z-index"] = 100;
      });
      event.element.addEventListener("mouseleave", () => {
        event.element.style["z-index"] = null == event.overlap ? 0 : event.overlap.index;
      });
    }

    // add the tooltip if help text exists
    if (event.help) {
      event.element.setAttribute("data-bs-toggle", "tooltip");
      event.element.setAttribute("data-bs-html", "true");
      event.element.setAttribute("data-bs-title", event.help);
      event.tooltip = new bootstrap.Tooltip(event.element);
    }

    // add the on_click event if it exists
    if (CN_common.is_function(event.on_click)) {
      event.element.addEventListener("mousedown", (e) => {
        e.stopPropagation(); // do not propagate to the day mousedown event
      });
      event.element.addEventListener("click", (e) => {
        e.stopPropagation(); // do not propagate to the day click event
        event.on_click(event)
      });
    }

    return event.element;
  }
}
