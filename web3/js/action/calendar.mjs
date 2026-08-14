import { CN_api } from "../api.mjs"
import { CN_base_action } from "./base_action.mjs"
import { CN_common } from "../common.mjs"
import { CN_element_calendar } from "../element/calendar.mjs"
import { CN_modal_message } from "../modal/message.mjs"
import { CN_session } from "../session.mjs"

export class CN_action_calendar extends CN_base_action {
  #calendar;
  #placeholder_calendar;
  #records = [];
  #total_records = null;

  /**
   * Constructor
   * @param base_model model: The model that the list action belongs to
   */
  constructor(parent_el, model) {
    super("calendar", parent_el, model);
  }

  /**
   * Extends the parent method
   */
  async configure() {
    const config = await this.get_model().clone_calendar();
    for (const prop in config) this.set_config(prop, config[prop]);

    const calendar = {
      ...{
        mode: this.has_config("mode") ? this.get_config("mode") : "week",
        date: this.has_config("date") ? this.get_config("date") : CN_common.get_date(),
        allow_selection: this.has_config("on_select"),
      },
      ...JSON.parse(this.get_query_parameter("calendar"))
    };

    // pass through the scroll_time and on_click_cell configs to the calendar
    if (this.has_config("scroll_time")) calendar.scroll_time = this.get_config("scroll_time");
    if (this.has_config("on_click_cell")) calendar.on_click_cell = this.get_config("on_click_cell");

    if (CN_common.is_string(calendar.date)) calendar.date = CN_common.get_date(`${calendar.date} 12:00:00`);
    this.#calendar = new CN_element_calendar(null, calendar);

    // the placeholder calendar can use the same config, just remove the interactions
    const placeholder_calendar = CN_common.clone(calendar);
    placeholder_calendar.allow_selection = false;
    placeholder_calendar.on_click_cell = null;
    this.#placeholder_calendar = new CN_element_calendar(null, placeholder_calendar);
  }

  /**
   * Extends the parent method
   */
  async get_text(type) {
    if ("crumb" == type) {
      return "Calendar";
    }

    if ("header" == type) {
      return `${CN_common.uc_words(this.get_model().get_singular())} Calendar`;
    }

    return await super.get_text(type);
  }

  /**
   * Extend parent method
   */
  set_config(name, value) {
    super.set_config(name, value);

    if (this.#calendar) {
      // if changing the on_select config then also update the calendar's allow_selection config
      if ("on_select" == name) {
        this.#calendar.set_config("allow_selection", CN_common.is_function(this.get_config("on_select")));
      } else if ("scroll_time" == name) {
        // pass through the scroll_time config to the calendar
        this.#calendar.set_config("scroll_time", this.get_config("scroll_time"));
      } else if ("on_click_cell" == name) {
        // pass through the on_click_cell config to the calendar
        this.#calendar.set_config("on_click_cell", this.get_config("on_click_cell"));
      }
    }
  }

  /**
   * ADD DOCS
   */
  write_query_parameters() {
    let calendar = null;

    const mode = this.#calendar.get_mode();
    const default_mode = this.has_config("mode") ? this.get_config("mode") : "week";
    if (default_mode != mode) {
      if (null == calendar) calendar = {};
      calendar.mode = mode;
    }
    const today_string = CN_common.format_datetime(CN_common.get_date(), "record").replace(/ .*/, "");
    const date_string = CN_common.format_datetime(this.#calendar.get_date(), "record").replace(/ .*/, "");
    if (today_string != date_string) {
      if (null == calendar) calendar = {};
      calendar.date = date_string;
    }

    this.set_query_parameter("calendar", null == calendar ? null : JSON.stringify(calendar));
  }

  // getters
  get_mode() { return this.#calendar.get_mode(); }
  get_date() { return this.#calendar.get_date(); }

  /**
   * Returns the record count
   * @return integer
   */
  get_record_count() {
    return this.#total_records;
  }

  /**
   * Returns the formatted record count (eg: [num] followed by * if the table is filtered)
   * @return string
   */
  get_formatted_record_count() {
    return `[${null === this.#total_records ? "..." : this.#total_records}]`;
  }

  /**
   * Override the parent method
   */
  get_on_load_path() {
    return this.get_model().get_base_path("api");
  }

  /**
   * Extend the parent method
   */
  get_on_load_parameters() {
    // Every event has: title, help, start, end, help, identifier, type (primary/secondary/etc)
    return {
      select: this.get_config("select"),
      modifier: this.get_config("modifier"),
      min_date: CN_common.format_datetime(this.#calendar.get_min_date(), "record").substr(0, 10),
      max_date: CN_common.format_datetime(this.#calendar.get_max_date(), "record").substr(0, 10),
    };
  }

  /**
   * Extends parent method
   */
  async on_load() {
    await super.on_load();
    const model = this.get_model();
    const parent_model = model.get_parent_model();

    const response = await CN_api.get(this.get_on_load_path(), this.get_on_load_parameters(), true);
    this.#total_records = Number(response.headers.get("X-Total"));

    // replace the records at the current page with the returned records
    this.#records = await response.json();

    this.#calendar.set_events(
      this.#records.map(record => ({
        ...{
          type: "primary", // the default event type
          // create a Date object either from the datetime or start_datetime column
          date: new Date(record.datetime ? record.datetime : record.start_datetime),
          // use the provided duration or determine if there is an end_datetime column
          duration: (
            record.duration ?
            record.duration :
            (new Date(record.end_datetime) - new Date(record.start_datetime)) / 60000
          ),
          on_click: this.get_config("on_click_event"), // include the on_click listener defined in the parameters
        },
        ...record,
      }))
    );
  }

  async on_dom_remove() {
    await super.on_dom_remove();

    // For some reason the calendar element doesn't fire dom remove events.
    // To prevent event tooltips from staying open unset all events when this action is removed from the DOM
    this.#calendar.set_events([]);
  }

  /**
   * Extends parent method
   */
  update_element() {
    super.update_element();

    const model = this.get_model();
    const date = this.#calendar.get_date();
    this.get_footer_element().querySelector("div[name=summary]").innerHTML = [
      this.#total_records,
      1 == this.#total_records ? model.get_singular() : model.get_plural(),
      "total in",
      CN_common.get_month(date.getMonth()),
      date.getFullYear(),
    ].join(" ");
  }

  /**
   * Extends parent method
   */
  _create_body_element() {
    const body_el = this.constructor.html('<div></div>');

    this.#calendar.set_parent_element(body_el);
    body_el.append(this.#calendar.get_element());

    this.#calendar.add_event_listener("modechanged", async () => {
      this.#placeholder_calendar.set_mode(this.#calendar.get_mode());
      this.#placeholder_calendar.update_element();
      this.write_query_parameters();
      await this.run();
    });

    this.#calendar.add_event_listener("datechanged", async () => {
      this.#placeholder_calendar.set_date(this.#calendar.get_date());
      this.#placeholder_calendar.update_element();
      this.write_query_parameters();
      await this.run();
    });

    if (this.has_config("on_select")) {
      this.#calendar.add_event_listener("selectionchanged", async (e, dates, events) => {
        const on_select = this.get_config("on_select");
        if (CN_common.is_function(on_select)) await on_select(this.get_model(), dates, events);
      });
    }

    return body_el;
  }

  /**
   * Extends parent method
   */
  _create_placeholder_element() {
    const placeholder_el = this.constructor.html('<div class="container-fluid"></div>');
    this.#placeholder_calendar.set_parent_element(placeholder_el);
    placeholder_el.append(this.#placeholder_calendar.get_element());
    return placeholder_el;
  }

  /**
   * Extends parent method
   */
  _create_header_element() {
    const header_el = super._create_header_element();

    const report_div_el = this.constructor.html(`
      <div class="dropdown" name="report">
        <button name="report" type="button" class="btn btn-primary px-2 py-0" data-bs-toggle="dropdown">
          <i class="bi bi-cloud-download fs-5"></i>
        </button>
        <ul class="dropdown-menu bg-secondary">
          <li>
            <div class="dropdown-header text-bg-secondary">Download List Data</div>
          </li>
          <li class="bg-body">
            <button
              type="button"
              name="csv"
              class="dropdown-item"
            >Comma Separated Values (.csv)</button>
          </li>
          <li class="bg-body">
            <button
              type="button"
              name="xlsx"
              class="dropdown-item"
            >Microsoft Excel (.xlsx)</button>
          </li>
          <li class="bg-body">
            <button
              type="button"
              name="ods"
              class="dropdown-item"
            >OpenDocument Spreadsheet (.ods)</button>
          </li>
        </ul>
      </div>
    `);

    ["csv", "xlsx", "ods"].forEach(format => {
      report_div_el.querySelector(`button[name=${format}]`).addEventListener("click", async () => {
        if (!this.get_model().allow_report()) {
          await CN_modal_message.create_and_open({
            header_class: "text-bg-danger",
            title: "Error",
            message: "You cannot download data from this list.",
          });
        } else if (this.#total_records > CN_session.get("application", "max_big_report")) {
          await CN_modal_message.create_and_open({
            header_class: "text-bg-danger",
            title: "Error",
            message: "The list has too many rows to download.",
          });
        } else if ("csv" != format && this.#total_records > CN_session.get("application", "max_small_report")) {
          await CN_modal_message.create_and_open({
            header_class: "text-bg-danger",
            title: "Error",
            message: "The list can only be downloaded as a CSV file.",
          });
        } else {
          const model = this.get_model();
          const parent_model = model.get_parent_model();
          const params = this.get_on_load_parameters();
          params.modifier.limit = CN_session.get("application", "max_big_report");
          delete params.modifier.offset;
          const response = await CN_api.file(this.get_on_load_path(), format, params, true);
          CN_common.download_file(
            await response.blob(),
            response.headers.get("content-disposition").match(/filename=(.*);/)[1],
          );
        }
      });
    });
    header_el.querySelector("button[name=refresh]").before(report_div_el);

    return header_el;
  }

  /**
   * Extends parent method
   */
  _create_footer_element() {
    const footer_el = this.constructor.html(
      '<div class="d-flex align-items-center justify-content-between"></div>'
    );

    footer_el.append(this.constructor.html('<div class="btn-group" role="group" name="left-btn-group"></div>'));
    footer_el.append(this.constructor.html('<div name="summary" class="text-center fs-6">Loading...</div>'));
    footer_el.append(this.constructor.html('<div class="btn-group" role="group" name="right-btn-group"></div>'));

    // add a button that brings the calendar to today's date
    const today_btn_el = this.constructor.html(
      '<button type="button" name="today" class="btn btn-light btn-outline-primary">Today</button>'
    );
    footer_el.querySelector("div[name=left-btn-group]").append(today_btn_el);
    today_btn_el.addEventListener("click", () => this.#calendar.set_date(CN_common.get_date()));

    // add a view list button (if listing is allowed)
    const model = this.get_model();
    if (model.allow_list()) {
      const list_btn_el = this.constructor.html(`
        <button type="button" name="list" class="btn btn-primary">
          View ${CN_common.uc_words(model.get_singular())} List
        </button>
      `);
      footer_el.querySelector("div[name=right-btn-group]").append(list_btn_el);
      list_btn_el.addEventListener("click", () => CN_session.navigate_to(model.get_list_url()));
    }

    return footer_el;
  }

  /**
   * Extends parent method
   */
  _create_element() {
    const el = super._create_element();
    el.querySelector("div.card-body").classList.add("p-0");
    return el;
  }
}
