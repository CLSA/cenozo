import { CN_api } from "../api.mjs"
import { CN_base_action } from "./base_action.mjs"
import { CN_common } from "../common.mjs"
import { CN_element_calendar } from "../element/calendar.mjs"
import { CN_modal_message } from "../modal/message.mjs"
import { CN_session } from "../session.mjs"

export class CN_action_calendar extends CN_base_action {
  #calendar_element;
  #placeholder_calendar_element;
  #params;
  #records = [];
  #total_records = null;

  /**
   * Constructor
   * @param base_model model: The model that the list action belongs to
   */
  constructor(parent_el, model) {
    super("calendar", parent_el, model);

    this.#params = model.clone_calendar();
    let calendar = JSON.parse(this.get_query_parameter("calendar"));
    if (null == calendar) calendar = { mode: "month", date: new Date() };
    if (CN_common.is_string(calendar.date)) calendar.date = new Date(`${calendar.date} 12:00:00`);
    this.#calendar_element = new CN_element_calendar(null, calendar);
    this.#placeholder_calendar_element = new CN_element_calendar(null, calendar);
  }

  /**
   * Extends the parent method
   */
  async get_text(type) {
    if ("crumb" == type) {
      return CN_common.uc_words(this.get_model().get_plural());
    }

    if ("header" == type) {
      return `${CN_common.uc_words(this.get_model().get_singular())} List`;
    }

    return await super.get_text(type);
  }

  /**
   * ADD DOCS
   */
  write_query_parameters() {
    let calendar = null;

    const mode = this.#calendar_element.get_mode();
    if ("month" != mode) {
      if (null == calendar) calendar = {};
      calendar.mode = mode;
    }
    const today_string = CN_common.format_datetime(new Date(), "record").replace(/ .*/, "");
    const date_string = CN_common.format_datetime(this.#calendar_element.get_date(), "record").replace(/ .*/, "");
    if (today_string != date_string) {
      if (null == calendar) calendar = {};
      calendar.date = date_string;
    }

    this.set_query_parameter("calendar", null == calendar ? null : JSON.stringify(calendar));
  }

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
      select: this.#params.select,
      modifier: this.#params.modifier,
      min_date: CN_common.format_datetime(this.#calendar_element.get_min_date(), "record").substr(0, 10),
      max_date: CN_common.format_datetime(this.#calendar_element.get_max_date(), "record").substr(0, 10),
    };
  }

  /**
   * Extends parent method
   */
  async on_load() {
    const model = this.get_model();
    const parent_model = model.get_parent_model();

    const response = await CN_api.get(this.get_on_load_path(), this.get_on_load_parameters(), true);
    this.#total_records = Number(response.headers.get("X-Total"));

    // replace the records at the current page with the returned records
    this.#records = await response.json();

    this.#calendar_element.set_events(
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
          on_click: this.#params.on_click, // include the on_click listener defined in the parameters
        },
        ...record,
      }))
    );
  }

  async on_dom_remove() {
    await super.on_dom_remove();

    // For some reason the calendar element doesn't fire dom remove events.
    // To prevent event tooltips from staying open unset all events when this action is removed from the DOM
    this.#calendar_element.set_events([]);
  }

  /**
   * Extends parent method
   */
  update_element() {
    super.update_element();

    const model = this.get_model();
    const date = this.#calendar_element.get_date();
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
  create_body_element() {
    const body_el = this.constructor.html('<div class="container-fluid"></div>');

    this.#calendar_element.set_parent_element(body_el);
    body_el.append(this.#calendar_element.get_element());
    this.#calendar_element.add_event_listener("modechanged", async () => {
      this.#placeholder_calendar_element.set_mode(this.#calendar_element.get_mode());
      this.#placeholder_calendar_element.update_element();
      this.write_query_parameters();
    });
    this.#calendar_element.add_event_listener("datechanged", async () => {
      this.#placeholder_calendar_element.set_date(this.#calendar_element.get_date());
      this.#placeholder_calendar_element.update_element();
      this.write_query_parameters();
      await this.run();
    });

    return body_el;
  }

  /**
   * Extends parent method
   */
  create_placeholder_element() {
    const placeholder_el = this.constructor.html('<div class="container-fluid"></div>');
    this.#placeholder_calendar_element.set_parent_element(placeholder_el);
    placeholder_el.append(this.#placeholder_calendar_element.get_element());
    return placeholder_el;
  }

  /**
   * Extends parent method
   */
  create_header_element() {
    const header_el = super.create_header_element();

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
            <button name="csv" class="dropdown-item" href="#">Comma Separated Values (.csv)</button>
          </li>
          <li class="bg-body">
            <button name="xlsx" class="dropdown-item" href="#">Microsoft Excel (.xlsx)</button>
          </li>
          <li class="bg-body">
            <button name="ods" class="dropdown-item" href="#">OpenDocument Spreadsheet (.ods)</button>
          </li>
        </ul>
      </div>
    `);

    ["csv", "xlsx", "ods"].forEach(format => {
      report_div_el.querySelector(`button[name=${format}]`).addEventListener("click", async () => {
        if (!this.get_model().allow_report()) {
          await CN_modal_message.create_and_open({
            title: "Error",
            message: "You cannot download data from this list.",
            header_class: "text-bg-danger",
          });
        } else if (this.#total_records > CN_session.get("application", "max_big_report")) {
          await CN_modal_message.create_and_open({
            title: "Error",
            message: "The list has too many rows to download.",
            header_class: "text-bg-danger",
          });
        } else if ("csv" != format && this.#total_records > CN_session.get("application", "max_small_report")) {
          await CN_modal_message.create_and_open({
            title: "Error",
            message: "The list can only be downloaded as a CSV file.",
            header_class: "text-bg-danger",
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
  create_footer_element() {
    const footer_el = this.constructor.html(
      '<div class="d-flex align-items-center justify-content-between"></div>'
    );

    footer_el.append(this.constructor.html('<div></div>'));
    footer_el.append(this.constructor.html('<div name="summary" class="text-center fs-6">Loading...</div>'));
    const today_btn_el = this.constructor.html(
      '<button name="today" class="btn btn-light btn-outline-primary">Today</button>'
    );
    footer_el.append(today_btn_el);
    today_btn_el.addEventListener("click", () => this.#calendar_element.set_date(new Date()));

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
