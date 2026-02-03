import CN_element from "../../element.mjs"
import CN_session from "../../session.mjs"

import { CN_base_object } from "../../base_object.mjs"

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
  #topfooter_el;
  #is_loading = false;
  #is_placeholder = true;
  #placeholder_timeout_id = null;
  #simple_mode = false;
  #footer_at_top = false;

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
  get_query_parameter(key) {
    return this.#model.get_module().get_action_query_parameter(this.#type, key);
  }
  set_query_parameter(key, value) {
    return this.#model.get_module().set_action_query_parameter(this.#type, key, value);
  }
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
  get_topfooter_element() {
    if (!this.#topfooter_el) this.#topfooter_el = this.create_topfooter_element();
    return this.#topfooter_el;
  }
  get_simple_mode() { return this.#simple_mode; }
  set_simple_mode(value) { this.#simple_mode = !!value; }
  get_footer_at_top() { return this.#footer_at_top; }
  set_footer_at_top(value) { this.#footer_at_top = !!value; }

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
    if (this.#simple_mode) {
      const placeholder_el = this.get_placeholder_element();
      const body_el = this.get_element().querySelector(":scope > div");
      body_el.innerHTML = "";
      if (placeholder_el) body_el.append(placeholder_el);
    } else {
      const card_header_el = this.get_element().querySelector(":scope > div > div.card > .card-header");
      card_header_el.innerHTML = "Loading...";

      if (this.#footer_at_top) {
        const card_topfooter_el = this.get_element().querySelector(":scope > div > div.card > .card-topfooter");
        card_topfooter_el.innerHTML = "";
      }

      const placeholder_el = this.get_placeholder_element();
      const card_body_el = this.get_element().querySelector(":scope > div > div.card > .card-body");
      card_body_el.innerHTML = "";
      if (placeholder_el) card_body_el.append(placeholder_el);

      const card_footer_el = this.get_element().querySelector(":scope > div > div.card > .card-footer");
      card_footer_el.innerHTML = "";
    }
  }

  /**
   * Removes placeholders from all dynamic elements
   */
  hide_placeholder() {
    this.#is_placeholder = false;

    if (this.#simple_mode) {
      const body_el = this.get_element().querySelector(":scope > div");
      body_el.innerHTML = "";
      if (body_el) body_el.append(this.get_body_element());
    } else {
      const header_el = this.get_header_element();
      const card_header_el = this.get_element().querySelector(":scope > div > div.card > .card-header");
      card_header_el.innerHTML = "";
      if (header_el) card_header_el.append(this.get_header_element());

      if (this.#footer_at_top) {
        const topfooter_el = this.get_topfooter_element();
        const card_topfooter_el = this.get_element().querySelector(":scope > div > div.card > .card-topfooter");
        card_topfooter_el.innerHTML = "";
        if (topfooter_el) card_topfooter_el.append(this.get_topfooter_element());
      }

      const body_el = this.get_body_element();
      const card_body_el = this.get_element().querySelector(":scope > div > div.card > .card-body");
      card_body_el.innerHTML = "";
      if (body_el) card_body_el.append(this.get_body_element());

      const footer_el = this.get_footer_element();
      const card_footer_el = this.get_element().querySelector(":scope > div > div.card > .card-footer");
      card_footer_el.innerHTML = "";
      if (footer_el) card_footer_el.append(this.get_footer_element());
    }
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
   * This method is run when the action is added to the DOM
   */
  async on_dom_add() {}

  /**
   * This method is run when the action is added to the DOM
   */
  async on_dom_remove() {}

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

    // add a data notation button
    const notation_btn_el = CN_element.create(`
      <button name="notation" class="btn btn-primary px-2 py-0">
        <i class="bi-info-circle fs-5"></i>
      </button>
    `);
    notation_btn_el.addEventListener("click", async (event) => {
      const module = this.get_model().get_module();
      const response = await CN_element.input_modal({
        title: "Page Documentation",
        message: "Provide documentation relevant to this page, or leave blank if no documentation is required.",
        input: "text",
        value: module.get_notation(this.#type),
      }).get();

      if (undefined !== response) module.set_notation(this.#type, response);
    });
    el.append(notation_btn_el);
    new bootstrap.Tooltip(notation_btn_el, {
      title: "Documentation",
      trigger: "hover",
      delay: { "show": 500, "hide": 100 },
    });

    // add a data refresh button
    const refresh_btn_el = CN_element.create(`
      <button name="refresh" class="btn btn-primary px-2 py-0">
        <i class="bi-arrow-clockwise fs-5"></i>
      </button>
    `);
    refresh_btn_el.addEventListener("click", this.run.bind(this));
    el.append(refresh_btn_el);
    new bootstrap.Tooltip(refresh_btn_el, {
      title: "Refresh Data",
      trigger: "hover",
      delay: { "show": 500, "hide": 100 },
    });

    return el;
  }

  /**
   * Creates the action's element's topfooter element
   * @return Element
   */
  create_topfooter_element() {
    return this.get_footer_element().cloneNode(true);
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
    return CN_element.create_loading_box();
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
    const el = CN_element.create(`<div></div>`);
    if (null == this.#model.get_action_name()) return el;

    el.setAttribute("name", this.#model.get_action_name());
    const placeholder_el = this.get_placeholder_element();
    if (this.#simple_mode) {
      // make sure to put the placeholder inside of a div (for body/placeholder swapping to work correctly)
      const div_el = CN_element.create("<div></div>");
      if (placeholder_el) div_el.append(placeholder_el);
      el.append(div_el);
    } else {
      el.append(CN_element.create_card({
        header: "Loading...",
        body: placeholder_el ? placeholder_el : "",
        footer: "",
      }));

      if (this.#footer_at_top) {
        el.querySelector(".card-header").after(CN_element.create(`
          <div
            class="card-topfooter text-bg-secondary fs-5"
            style="
              padding: var(--bs-card-cap-padding-y) var(--bs-card-cap-padding-x);
              border-top: var(--bs-card-border-width) solid var(--bs-card-border-color);
            "
          ></div>
        `));
      }
    }

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
