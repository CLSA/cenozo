import { CN_base_element } from "../element/base_element.mjs"
import { CN_common } from "../common.mjs"
import { CN_element_card } from "../element/card.mjs"
import { CN_element_loading_box } from "../element/loading_box.mjs"
import { CN_modal_input } from "../modal/input.mjs"
import { CN_modal_message } from "../modal/message.mjs"
import { CN_session } from "../session.mjs"

/**
 * The base class for all action classes (add/view/list/etc)
 */
export class CN_base_action extends CN_base_element {
  #type;
  #model = null;
  #disabled = false;
  #header_el;
  #body_el;
  #placeholder_el;
  #footer_el;
  #topfooter_el;
  #is_placeholder = true;
  #placeholder_timeout_id = null;
  #placeholder_show_delay = 200;
  #simple_mode = false;
  #footer_at_top = false;

  /**
   * Constructor
   * @param string type: The type of action ("add", "list", "view", etc)
   * @param base_model model: The model that the action belongs to
   */
  constructor(type, parent_el, model) {
    super(parent_el, { name: type });

    if ("CN_base_action" == this.constructor) {
      throw new Error("Abstract class CN_base_action can't be instantiated.");
    }

    this.#type = type;
    this.#model = model;
  }

  // access methods
  get_type() { return this.#type }
  get_model() { return this.#model }
  get_disabled() { return this.#disabled; }
  set_disabled(disabled) { this.#disabled = disabled; }
  get_query_parameter(key) {
    return this.#model.get_module().get_action_query_parameter(this.#type, key);
  }
  set_query_parameter(key, value) {
    return this.#model.get_module().set_action_query_parameter(this.#type, key, value);
  }
  get_element() {
    // make sure the model is configured for rendering
    if (!this.#model.is_rendered()) {
      throw new Error(`
        Tried to get the element for the ${this.#type}-${this.#model.get_name()}
        action but the model has not been configured for rendering.
      `);
    }

    return super.get_element();
  }
  get_header_element() {
    // make sure the model is configured for rendering
    if (!this.#model.is_rendered()) {
      throw new Error(`
        Tried to get the header element for the ${this.#type}-${this.#model.get_name()}
        action but the model has not been configured for rendering.
      `);
    }

    if (!this.#header_el) this.#header_el = this._create_header_element();
    return this.#header_el;
  }
  get_body_element() {
    // make sure the model is configured for rendering
    if (!this.#model.is_rendered()) {
      throw new Error(`
        Tried to get the body element for the ${this.#type}-${this.#model.get_name()}
        action but the model has not been configured for rendering.
      `);
    }

    if (!this.#body_el) this.#body_el = this._create_body_element();
    return this.#body_el;
  }
  get_placeholder_element() {
    // make sure the model is configured for rendering
    if (!this.#model.is_rendered()) {
      throw new Error(`
        Tried to get the placeholder element for the ${this.#type}-${this.#model.get_name()}
        action but the model has not been configured for rendering.
      `);
    }

    if (!this.#placeholder_el) this.#placeholder_el = this._create_placeholder_element();
    return this.#placeholder_el;
  }
  get_footer_element() {
    // make sure the model is configured for rendering
    if (!this.#model.is_rendered()) {
      throw new Error(`
        Tried to get the footer element for the ${this.#type}-${this.#model.get_name()}
        action but the model has not been configured for rendering.
      `);
    }

    if (!this.#footer_el) this.#footer_el = this._create_footer_element();
    return this.#footer_el;
  }
  get_topfooter_element() {
    // make sure the model is configured for rendering
    if (!this.#model.is_rendered()) {
      throw new Error(`
        Tried to get the topfooter element for the ${this.#type}-${this.#model.get_name()}
        action but the model has not been configured for rendering.
      `);
    }

    if (!this.#topfooter_el) this.#topfooter_el = this._create_topfooter_element();
    return this.#topfooter_el;
  }
  get_placeholder_show_delay() { return this.#placeholder_show_delay; }
  set_placeholder_show_delay(placeholder_show_delay) { this.#placeholder_show_delay = placeholder_show_delay; }
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
    const model_el = this.#model.get_element();

    const placeholder_el = this.get_placeholder_element();
    if (this.#simple_mode) {
      const body_el = model_el.querySelector(":scope > div");
      body_el.replaceChildren(placeholder_el);
    } else {
      const card_header_el = model_el.querySelector(":scope > div > div.card > .card-header");
      card_header_el.replaceChildren(this.constructor.html(`
        <div class="d-flex">
          <div class="flex-grow-1">Loading...</div>
          <button type="button" name="refresh" class="btn btn-primary disabled px-2 py-0">
            <i class="bi bi-arrow-clockwise fs-5"></i>
          </button>
        </div>
      `));

      if (this.#footer_at_top) {
        const card_topfooter_el = model_el.querySelector(":scope > div > div.card > .card-topfooter");
        card_topfooter_el.innerHTML = "";
      }

      const card_body_el = model_el.querySelector(":scope > div > div.card > .card-body");
      card_body_el.replaceChildren(placeholder_el);

      const card_footer_el = model_el.querySelector(":scope > div > div.card > .card-footer");
      card_footer_el.innerHTML = "";
    }
  }

  /**
   * Removes placeholders from all dynamic elements
   */
  hide_placeholder() {
    this.#is_placeholder = false;
    const model_el = this.#model.get_element();

    if (this.#simple_mode) {
      const body_el = model_el.querySelector(":scope > div");
      body_el.replaceChildren(this.get_body_element());
    } else {
      const header_el = this.get_header_element();
      const card_header_el = model_el.querySelector(":scope > div > div.card > .card-header");
      card_header_el.replaceChildren(this.get_header_element());

      if (this.#footer_at_top) {
        const topfooter_el = this.get_topfooter_element();
        const card_topfooter_el = model_el.querySelector(":scope > div > div.card > .card-topfooter");
        card_topfooter_el.replaceChildren(this.get_topfooter_element());
      }

      const body_el = this.get_body_element();
      const card_body_el = model_el.querySelector(":scope > div > div.card > .card-body");
      card_body_el.replaceChildren(this.get_body_element());

      const footer_el = this.get_footer_element();
      const card_footer_el = model_el.querySelector(":scope > div > div.card > .card-footer");
      card_footer_el.replaceChildren(this.get_footer_element());
    }
  }

  /**
   * Navigates to the action's parent action
   */
  async on_navigate_to_parent() {
    const parent_model = this.#model.get_parent_model();
    await CN_session.navigate_to(
      parent_model ?
      `${parent_model.get_view_url()}?tab=${this.#model.get_name()}` :
      this.#model.get_list_url()
    );
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
    if (this.#model.is_rendered()) {
      // Show placeholder while loading data
      if (null == this.#placeholder_timeout_id) {
        this.#placeholder_timeout_id = setTimeout(() => {
          this.show_placeholder();
        }, this.#placeholder_show_delay);
      }
    }
  }

  /**
   * Is called whenever the action is run and is responsible for loading the action's dynamic data
   * Note that elements should never be created, updated or referenced in the on_load() method,
   * use update_element() instead.
   */
  async on_load() {}

  /**
   * When running the action this method is always called after on_load()
   */
  on_post_loading() {
    if (this.#model.is_rendered()) {
      // Clear the timeout if we haven't fired it and hide the placeholder
      if (null != this.#placeholder_timeout_id) {
        clearTimeout(this.#placeholder_timeout_id);
        this.#placeholder_timeout_id = null;
      }
      if (this.#is_placeholder) this.hide_placeholder();
    }
  }

  /**
   * ADD DOCS
   */
  async open_notation() {
    const model = this.get_model();
    const title = `${CN_common.uc_words(model.get_singular())} ${CN_common.uc_words(this.#type)} Documentation`;
    const notation_module = CN_session.get_module("notation");
    const notation = this.get_model().get_module().get_notation(this.#type);
    if (notation_module && notation_module.action_allowed("edit")) {
      // open an input modal to allow editing the notation
      const response = await CN_modal_input.create_and_open({
        title: title,
        message:
          "Provide documentation relevant to this page, or leave blank if no documentation is required.",
        input: {
          type: "text",
          required: false,
          rows: 5,
          get_default: () => notation,
        },
      });

      if (undefined !== response) {
        await model.get_module().set_notation(this.#type, response);
        this.update_element();
      }
    } else {
      // display the notation
      await CN_modal_message.create_and_open({
        title: title,
        message: CN_common.nl_to_br(notation),
      });
    }
  }

  /**
   * Extend parent method
   */
  update_element() {
    // make sure the model is configured for rendering
    if (!this.#model.is_rendered()) {
      throw new Error(`
        Tried to update the element for the ${this.#type}-${this.#model.get_name()}
        action but the model has not been configured for rendering.
      `);
    }

    super.update_element();

    (async () => {
      this.get_header_element().querySelector("div.flex-grow-1").innerHTML = await this.get_text("header");
    })();

    const notation_btn_el = this.get_header_element().querySelector("button[name=notation]");
    const notation_module = CN_session.get_module("notation");
    const notation = this.get_model().get_module().get_notation(this.#type);
    if (notation || (notation_module && notation_module.action_allowed("edit"))) {
      notation_btn_el.classList.remove("d-none");
      if (notation) {
        notation_btn_el.querySelector("i").classList.add("text-warning");
      } else {
        notation_btn_el.querySelector("i").classList.remove("text-warning");
      }
    } else {
      notation_btn_el.classList.add("d-none");
    }
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

    if (this.#model.is_rendered()) this.update_element();
  }

  /**
   * Creates the action's element's header element
   * @return Element
   */
  _create_header_element() {
    const el = this.constructor.html('<div class="d-flex"><div class="flex-grow-1"></div></div>');

    // add a data notation button (not shown until update_element() is called)
    const notation_btn_el = this.constructor.html(`
      <button type="button" name="notation" class="btn btn-primary px-2 py-0 d-none">
        <i class="bi bi-info-circle fs-5"></i>
      </button>
    `);
    notation_btn_el.addEventListener("click", this.open_notation.bind(this));
    el.append(notation_btn_el);
    new bootstrap.Tooltip(notation_btn_el, {
      title: "Documentation",
      trigger: "hover",
      delay: { "show": 1000, "hide": 100 },
    });

    // add a data refresh button
    const refresh_btn_el = this.constructor.html(`
      <button type="button" name="refresh" class="btn btn-primary px-2 py-0">
        <i class="bi bi-arrow-clockwise fs-5"></i>
      </button>
    `);
    refresh_btn_el.addEventListener("click", this.run.bind(this));
    el.append(refresh_btn_el);
    new bootstrap.Tooltip(refresh_btn_el, {
      title: "Refresh Data",
      trigger: "hover",
      delay: { "show": 1000, "hide": 100 },
    });

    return el;
  }

  /**
   * Creates the action's element's topfooter element
   * @return Element
   */
  _create_topfooter_element() {
    return this.get_footer_element().cloneNode(true);
  }

  /**
   * Creates the action's element's body element
   * @return Element
   */
  _create_body_element() {
    return "";
  }

  /**
   * Creates the action's element's body element
   * @return Element
   */
  _create_placeholder_element() {
    return CN_element_loading_box.create();
  }

  /**
   * Creates the action's element's footer element
   * @return Element
   */
  _create_footer_element() {
    return "";
  }

  /**
   * Creates the action's element including the header, body and footer sub-elements
   * @return Element
   */
  _create_element() {
    const el = super._create_element();
    if (null == this.#model.get_action_name()) return el;

    const placeholder_el = this.get_placeholder_element();
    if (this.#simple_mode) {
      // make sure to put the placeholder inside of a div (for body/placeholder swapping to work correctly)
      const div_el = this.constructor.html("<div></div>");
      if (placeholder_el) div_el.append(placeholder_el);
      el.append(div_el);
    } else {
      CN_element_card.append(el, {
        header: this.constructor.html(`
          <div class="d-flex">
            <div class="flex-grow-1">Loading...</div>
            <button type="button" name="refresh" class="btn btn-primary disabled px-2 py-0">
              <i class="bi bi-arrow-clockwise fs-5"></i>
            </button>
          </div>
        `),
        body: placeholder_el ? placeholder_el : "",
        footer: "",
      });

      if (this.#footer_at_top) {
        el.querySelector(".card-header").after(this.constructor.html(`
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
}
