import CN_element from "./element.mjs"
import CN_session from "./session.mjs"

import { CN_base_object } from "./base_object.mjs"

/**
 * The base class for all action classes (add/view/list/etc)
 */
export class CN_base_action extends CN_base_object {
  #type;
  #model = null;
  #header_el;
  #body_el;
  #placeholder_el;
  #footer_el;
  #is_loading = false;
  #is_placeholder = true;
  #placeholder_timeout_id = null;

  /**
   * Constructor
   * @param string type: The type of action ("add", "list", "view", etc)
   * @param base_model model: The model that the action belongs to
   */
  constructor(type, model) {
    super();
    this.#type = type;
    this.#model = model;
  }

  // access methods
  get_type() { return this.#type }
  get_model() { return this.#model }
  get_element() { return this.#model.get_element() }
  get_header_element() {
    if (!this.#header_el) this.#header_el = this.create_header_element();
    return this.#header_el;
  }
  get_body_element() {
    if (!this.#body_el) this.#body_el = this.create_body_element();
    return this.#body_el;
  }
  get_placeholder_element() {
    if (!this.#placeholder_el) this.#placeholder_el = this.create_placeholder_element();
    return this.#placeholder_el;
  }
  get_footer_element() {
    if (!this.#footer_el) this.#footer_el = this.create_footer_element();
    return this.#footer_el;
  }

  /**
   * Gets UI text values by type
   * @param string type
   * @return string
   */
  async get_text(type) {
    return `ERROR_MISSING_TEXT(${type})`;
  }

  /**
   * Replaces all dynamic elements with a placeholder
   */
  show_placeholder() {
    this.#is_placeholder = true;

    const card_body_el = this.get_element().querySelector(".card-body");
    card_body_el.innerHTML = "";
    card_body_el.append(this.get_placeholder_element());
  }

  /**
   * Removes placeholders from all dynamic elements
   */
  hide_placeholder() {
    this.#is_placeholder = false;

    const card_body_el = this.get_element().querySelector(".card-body");
    card_body_el.innerHTML = "";
    card_body_el.append(this.get_body_element());
  }

  /**
   * Navigates to the action's parent action
   */
  async on_navigate_to_parent() {
    const parent_model = this.#model.get_parent_model();
    await CN_session.navigate_to(parent_model ? parent_model.get_view_url() : this.#model.get_list_url());
  }

  /**
   * Is called by the on_load() method to get the API query's path
   * @return string
   */
  get_on_load_path() {
    return null;
  }

  /**
   * Is called by the on_load() method to get the API query's parameters
   * @return object
   */
  get_on_load_parameters() {
    return null;
  }

  /**
   * When running the action this method is always called before on_load()
   */
  on_pre_loading() {
    this.#is_loading = true;

    // Show placeholder while loading data, but only if it takes longer than 200 ms
    this.#placeholder_timeout_id = setTimeout(() => {
      this.show_placeholder();
    }, 200);
  }

  /**
   * Is called whenever the action is run and is responsible for loading the action's dynamic data
   */
  async on_load() {}

  /**
   * When running the action this method is always called after on_load()
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
   * Updates the action's element
   */
  update_element() {
  }

  /**
   * Creates the action's element's header element
   * @return Element
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
    refresh_btn_el.addEventListener("click", async (event) => this.run());
    el.append(refresh_btn_el);
    new bootstrap.Tooltip(refresh_btn_el, {
      title: "Refresh Data",
      trigger: "hover",
      delay: { "show": 500, "hide": 100 },
    });

    return el;
  }

  /**
   * Creates the action's element's body element
   * @return Element
   */
  create_body_element() {
    return "";
  }

  /**
   * Creates the action's element's body element
   * @return Element
   */
  create_placeholder_element() {
    return "";
  }

  /**
   * Creates the action's element's footer element
   * @return Element
   */
  create_footer_element() {
    return "";
  }

  /**
   * Creates the action's element including the header, body and footer sub-elements
   * @return Element
   */
  render() {
    const el = CN_element.create('<div name="model-action"></div>');
    if (null == this.#model.get_action_name()) return el;

    el.append(CN_element.create_card());

    // add the header, body and footer
    el.querySelector(".card-header").append(this.get_header_element());
    el.querySelector(".card-body").append(this.get_placeholder_element());
    el.querySelector(".card-footer").append(this.get_footer_element());

    return el;
  }

  /**
   * Runs the dynamic parts of the action (loading data) and updates the element once ready
   * @param boolean children: Whether to also run the action's childern (if any)
   */
  async run(children = false) {
    if (null == this.#model.get_action_name()) return;

    this.on_pre_loading();
    await this.on_load();
    this.on_post_loading();

    this.update_element();
  }
}
