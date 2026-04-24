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
   * Updates the query parameters with the current table configuration
   * The tables parameter has the following form: {
   *   <table_name>: {
   *     page: the current page number
   *     order: null or [{}] or { column }
   *     columns: {
   *       <column_name>: [{
   *         operator: =|!=|<|>|LIKE|NOT LIKE|etc,
   *         value: the value to compare to,
   *         or: true when logically ORing the comparison (optional)
   *       )],
   *     }
   *   }
   * }
   */
  read_query_parameters() {
    // TODO: Get any calendar configurations from from URL query parameters
    const calendar = JSON.parse(this.get_query_parameter("calendar"));
  }

  /**
   * ADD DOCS
   */
  write_query_parameters() {
    // TODO: store calendar configurations into the URL query parameters
    let calendar = JSON.parse(this.get_query_parameter("calendar"));
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
    this.#calendar = CN_element_calendar.append(body_el, {
      date: new Date(),
    });
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
