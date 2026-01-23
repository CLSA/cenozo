import CN_common from "../../common.mjs"
import { CN_base_element } from "../base_element.mjs"
import { CN_element } from "../element.mjs"

const default_config = {
  type: "div",
  header_class: "text-bg-primary",
};

export class CN_base_modal extends CN_base_element {
  #resolve_button_list = [];
  #bootstrap_modal;
  #resolve;
  #reject;

  /**
   * Constructor
   * @param object config: A set of key/value pairs containing all of the modal's configuration parameters
   */
  constructor(config) {
    // the type must be div
    config.type = "div";
    
    // the class list is also pre-defined
    config.class = "modal fade";

    super({...default_config, ...config});

    // always setup a unique element id if one hasn't already be defined
    if (null == this.get_config("id")) {
      this.set_config("id", [this.get_class_name(), CN_common.get_random_hex_identifier()].join("-"));
    }
  }

  /**
   * Adds a button to the modal's footer that will resolve with the given value
   * @param string class_type: The button's class type (primary, secondary, success, danger, warning, info or light)
   * @param string title: The button's title
   * @param mixed value: The value to resolve the modal as, or a function that returns that value when called
   */
  add_resolve_button(class_type, title, value) {
    this.#resolve_button_list.push({ class_type, title, value });
  }

  /**
   * Opens the modal and returns a promise for async/await
   * @return Promise
   */
  async open() {
    return new Promise((resolve, reject) => {
      this.#resolve = resolve;
      this.#reject = reject;

      this.render();
      this.#bootstrap_modal.show();
    })
  }

  /**
   * Resolves the modal with the given value, typically used by the modal's button event listeners
   */
  _resolve(value) {
    this.#resolve(value);
  }

  /**
   * Returns the modal's header as an HTML element, can be overridden by child classes if necessary
   * @return Element
   */
  _create_header_element() {
    return CN_element.create(`<h1 class="modal-title fw-bold fs-5">${this.get_config("title")}</h1>`);
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
    const el = CN_element.create(`
      <div>
        <div name="left-btn-group" class="btn-group"><\div>
        <div name="right-btn-group" class="btn-group">
        </div>
      </div>
    `);

    const right_btn_group = el.querySelector("[name=right-btn-group]");
    this.#resolve_button_list.forEach(button => {
      const title = CN_common.escape_html(button.title);
      const btn_el = CN_element.create(`
        <button
          type="button"
          name="${title}"
          class="btn btn-${button.class_type}"
          data-bs-dismiss="modal"
        >${button.title}</button>
      `);
      btn_el.addEventListener("click", async () => {
        // Note: button.value may be a function
        this._resolve(CN_common.is_function(button.value) ? await button.value() : button.value);
      });
      right_btn_group.append(btn_el);
    });

    return el;
  }

  /**
   * Renders the modal and creates the bootstrap modal object
   */
  render() {
    const el = super.render();
    el.setAttribute("tabindex", "-1");
    el.append(CN_element.create(`
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header ${this.get_config("header_class")}"></div>
          <div class="modal-body"></div>
          <div class="modal-footer d-flex justify-content-between text-bg-secondary fs-5"></div>
        </div>
      </div>
    `));

    el.querySelector("div.modal-header").append(this._create_header_element());
    el.querySelector("div.modal-body").append(this._create_body_element());
    el.querySelector("div.modal-footer").append(this._create_footer_element());

    this.#bootstrap_modal = new bootstrap.Modal(el, { keyboard: false, backdrop: "static" });

    // automatically dispose of the modal once finished
    el.addEventListener("hidden.bs.modal", this.#destroy.bind(this));

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
