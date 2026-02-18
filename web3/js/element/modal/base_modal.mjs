import CN_common from "../../common.mjs"
import { CN_base_element } from "../base_element.mjs"

export class CN_base_modal extends CN_base_element {
  #resolve_button_list = [];
  #modal_event_listener_list = [];
  #bootstrap_modal;
  #resolve;
  #reject;

  /**
   * Constructor
   * @param object config: A set of key/value pairs containing all of the modal's configuration parameters
   */
  constructor(config = {}) {
    if (!CN_common.is_object(config)) {
      throw new Error("Non-object config argument passed to CN_base_modal contructor");
    }

    // the type must be div
    config.type = "div";

    // the class list is also pre-defined
    config.class = "modal fade";

    super(null, {
      ...{
        // default config
        header_class: "text-bg-primary",
        size: "lg",
        do_not_close: false,
      },
      ...config
    });

    // always setup a unique element id if one hasn't already be defined
    if (null == this.get_config("id")) {
      this.set_config("id", [this.get_class_name(), CN_common.get_random_hex_identifier()].join("-"));
    }

    // automatically dispose of the modal once finished
    this.add_modal_event_listener("hidden", this.#destroy.bind(this));
  }

  /**
   * Adds a button to the modal's footer that will resolve with the given value
   * @param string class_type: The button's class type (primary, secondary, success, danger, warning, info or light)
   * @param string title: The button's title
   * @param mixed on_click: Fired when the button is clicked (typically calling this._resolve())
   */
  add_resolve_button(class_type, title, on_click) {
    this.#resolve_button_list.push({ class_type, title, on_click });
  }

  /**
   * Returns a resolve button by title
   * @param string title: The button's title
   * @return { class_type, title, value, element }
   */
  get_resolve_button(title) {
    return this.#resolve_button_list.find(o => o.title == title);
  }

  /**
   * ADD DOCS
   */
  set_disabled(disabled) {
    this.#resolve_button_list.forEach(button => {
      button.element.disabled = disabled;
    });
  }

  /**
   * Opens the modal and returns a promise for async/await
   * @return Promise
   */
  async open() {
    return new Promise((resolve, reject) => {
      this.#resolve = resolve;
      this.#reject = reject;

      if (!this.#bootstrap_modal) {
        const el = this.get_element();
        this.#bootstrap_modal = new bootstrap.Modal(el, { keyboard: false, backdrop: "static" });

        // add all modal listeners
        this.#modal_event_listener_list.forEach(obj => {
          el.addEventListener(`${obj.type}.bs.modal`, obj.listener);
        });
      }

      this.#bootstrap_modal.show();
    })
  }

  /**
   * ADD DOCS
   */
  close() {
    this.#bootstrap_modal.hide();
  }

  /**
   * ADD DOCS
   */
  add_modal_event_listener(type, listener) {
    this.#modal_event_listener_list.push({ type, listener });
  }

  /**
   * Resolves the modal with the given value, typically used by the modal's button event listeners
   */
  _resolve(value) {
    if (!this.get_config("do_not_close")) this.close();
    this.#resolve(value);
  }

  /**
   * Extends the parent method
   */
  _create_header_element() {
    return this.constructor.html(`<h1 class="modal-title fw-bold fs-5">${this.get_config("title")}</h1>`);
  }

  /**
   * Returns the modal's body as an HTML element, must be overridden by child classes
   * @return Element
   */
  _create_body_element() {
    return "";
  }

  /**
   * Returns the modal's footer as an HTML element, must be overridden by child classes
   * @return Element
   */
  _create_footer_element() {
    const el = this.constructor.html(`
      <div class="d-flex w-100">
        <div name="left-btn-group" class="me-auto btn-group"></div>
        <div name="right-btn-group" class="btn-group"></div>
      </div>
    `);

    const right_btn_group = el.querySelector("[name=right-btn-group]");
    this.#resolve_button_list.forEach(button => {
      const title = CN_common.escape_html(button.title);
      button.element = this.constructor.html(`
        <button
          type="button"
          name="${title}"
          class="btn btn-${button.class_type}"
        >${button.title}</button>
      `);
      button.element.addEventListener("click", button.on_click);
      right_btn_group.append(button.element);
    });

    return el;
  }

  /**
   * Renders the modal and creates the bootstrap modal object
   */
  _create_element() {
    const el = super._create_element();
    el.setAttribute("tabindex", "-1");
    el.append(this.constructor.html(`
      <div class="modal-dialog modal-${this.get_config("size")}">
        <div class="modal-content">
          <div class="modal-header ${this.get_config("header_class")}"></div>
          <div class="modal-body"></div>
          <div class="modal-footer text-bg-secondary fs-5"></div>
        </div>
      </div>
    `));

    el.querySelector("div.modal-header").append(this._create_header_element());
    el.querySelector("div.modal-body").append(this._create_body_element());
    el.querySelector("div.modal-footer").append(this._create_footer_element());

    return el;
  }

  /**
   * Removes the modal from the DOM
   */
  #destroy() {
    const modal = document.getElementById(this.get_config("id"));
    if (modal) {
      this.#bootstrap_modal.dispose();
      modal.remove();
    }
  }
}
