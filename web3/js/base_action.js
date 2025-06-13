import CN_element from "./element.js"
import CN_session from "./session.js"

import { CN_base_object } from "./base_object.js"

/**
 * The base class for all action classes (add/view/list/etc)
 */
export class CN_base_action extends CN_base_object {
  #parent_model = null;
  #is_loading = false;
  #is_placeholder = false;
  #placeholder_timeout_id = null;

  // getters and setters
  get parent_model() { return this.#parent_model }
  get element() { return this.#parent_model.element }
  get is_loading() { return this.#is_loading }
  get is_placeholder() { return this.#is_placeholder }

  /**
   * Constructor
   * @param base_model parent_model The model that the action belongs to
   */
  constructor(parent_model) {
    super();
    this.#parent_model = parent_model;
  }

  /**
   * ADD DOCS
   */
  async get_text(type) {
    return `ERROR_MISSING_TEXT(${type})`;
  }

  /**
   * ADD DOCS
   */
  show_placeholder() {
    this.#is_placeholder = true;
  }

  /**
   * ADD DOCS
   */
  hide_placeholder() {
    this.#is_placeholder = false;
  }

  /**
   * ADD DOCS
   */
  async on_navigate_to_parent() {
    const parent_module = this.parent_model.get_parent_module();
    await CN_session.navigate_to(
      parent_module ?
      parent_module.model.get_view_url() :
      this.parent_model.get_list_url()
    );
  }

  /**
   * ADD DOCS
   */
  on_pre_loading() {
    this.#is_loading = true;

    // Show placeholder while loading data, but only if it takes longer than 200 ms
    this.#placeholder_timeout_id = setTimeout(() => {
      this.show_placeholder();
    }, 200);
  }

  /**
   * ADD DOCS
   */
  async on_load() {
  }

  /**
   * ADD DOCS
   */
  on_post_loading() {
    this.#is_loading = false;

    // Clear the timeout if we haven't fired it and hide the placeholder
    if (null != this.#placeholder_timeout_id) {
      clearTimeout(this.#placeholder_timeout_id);
      this.#placeholder_timeout_id = null;
    }
    if (this.#is_placeholder) this.hide_placeholder();
  }

  /**
   * ADD DOCS
   */
  update_element() {
  }

  /**
   * ADD DOCS
   */
  create_header_element() {
    const el = CN_element.create('<div class="d-flex"><div class="flex-grow-1"></div></div>');
    (async () => { el.querySelector("div.flex-grow-1").innerHTML = await this.get_text("header"); })();

    // add a data refresh button
    const refresh_btn_el = CN_element.create(`
      <button class="btn btn-primary px-2 py-0">
        <i class="bi-arrow-clockwise fs-5"></i>
      </button>
    `);
    refresh_btn_el.onclick = () => this.run();
    el.append(refresh_btn_el);
    new bootstrap.Tooltip(refresh_btn_el, {
      title: "Refresh Data",
      trigger: "hover",
      delay: { "show": 500, "hide": 100 },
    });

    return el;
  }

  /**
   * ADD DOCS
   */
  create_body_element() {
    return "";
  }

  /**
   * ADD DOCS
   */
  create_footer_element() {
    return "";
  }

  /**
   * ADD DOCS
   */
  render() {
    const el = CN_element.create('<div name="model-action"></div>');
    if (!this.#parent_model.module.hasOwnProperty("operation")) return el;

    el.append(CN_element.create_card());

    // add the header, body and footer
    el.querySelector(".card-header").append(this.create_header_element());
    el.querySelector(".card-body").append(this.create_body_element());
    el.querySelector(".card-footer").append(this.create_footer_element());

    return el;
  }

  /**
   * ADD DOCS
   */
  async run() {
    if (!this.#parent_model.module.operation) return;

    this.on_pre_loading();
    await this.on_load();
    this.on_post_loading();

    this.update_element();
  }
}
