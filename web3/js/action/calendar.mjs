import { CN_api } from "../api.mjs"
import { CN_base_action } from "./base_action.mjs"
import { CN_common } from "../common.mjs"
import { CN_element_calendar } from "../element/calendar.mjs"

export class CN_action_calendar extends CN_base_action {
  #calendar;

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

    const mode = this.#calendar.get_mode();
    if ("month" != mode) {
      if (null == calendar) calendar = {};
      calendar.mode = mode;
    }
    const today_string = CN_common.format_datetime(new Date(), "record").replace(/ .*/, "");
    const date_string = CN_common.format_datetime(this.#calendar.get_date(), "record").replace(/ .*/, "");
    if (today_string != date_string) {
      if (null == calendar) calendar = {};
      calendar.date = date_string;
    }

    this.set_query_parameter("calendar", null == calendar ? null : JSON.stringify(calendar));
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
    return {};
  }

  /**
   * Extends parent method
   */
  update_element() {
    super.update_element();
  }

  /**
   * Extends parent method
   */
  create_body_element() {
    const body_el = this.constructor.html('<div class="container-fluid"></div>');

    let calendar = JSON.parse(this.get_query_parameter("calendar"));
    if (null == calendar) calendar = { mode: "month", date: new Date() };
    if (CN_common.is_string(calendar.date)) calendar.date = new Date(`${calendar.date} 12:00:00`);
    this.#calendar = CN_element_calendar.append(body_el, calendar);
    this.#calendar.add_event_listener("modechanged", this.write_query_parameters.bind(this));
    this.#calendar.add_event_listener("datechanged", this.write_query_parameters.bind(this));

    return body_el;
  }

  /**
   * Extends parent method
   */
  create_placeholder_element() {
    const placeholder_el = this.constructor.html("<div></div>");
    return placeholder_el;
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
