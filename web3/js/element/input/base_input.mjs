import CN_common from "../../common.mjs"

import { CN_base_element } from "../base_element.mjs"
import { CN_state } from "../../state.mjs"

export class CN_base_input extends CN_base_element {
  #action;
  #state;
  #control_id;
  #control_name;
  #control_el;
  #prefix_div_el;
  #input_div_el;
  #control_div_el;
  #error_div_el;
  #postfix_div_el;
  #event_listeners = true;

  /**
   * Base class for all inputs
   * @param object config: A set of key/value pairs containing all of the input's configuration parameters
   */
  constructor(parent_el, config = {}) {
    if (!CN_common.is_object(config)) {
      throw new Error("Non-object config argument passed to CN_base_input contructor");
    }

    // the id and name config parameters are used for an child element, not the root element
    const id = config.id;
    delete config.id;
    const name = config.name;
    delete config.name;

    // the action parameter is used to optionally track the action this input belongs to, not the root element
    const action = config.action;
    delete config.action;

    // don't replace classes, append them instead
    config.class = ["d-flex align-items-center", config.class].join(" ").trim();

    super(parent_el, {
      ...{
        // default config
        type: "div",
        error_timeout: 0,
      },
      ...config
    });

    if ("CN_base_input" == this.constructor) {
      throw new Error("Abstract class CN_base_input can't be instantiated.");
    }

    this.#action = action;
    this.#control_id = id;
    this.#control_name = name;
    this.#state = new CN_state();
  }

  /**
   * ADD DOCS
   */
  get_event_listeners() {
    return this.#event_listeners;
  }

  /**
   * ADD DOCS
   */
  set_event_listeners(enable) {
    this.#event_listeners = enable;
  }

  /**
   * ADD DOCS
   */
  get_action() {
    return this.#action;
  }

  /**
   * ADD DOCS
   */
  get_control_element() {
    return this.#control_el;
  }

  /**
   * ADD DOCS
   */
  get_prefix_div_element() {
    return this.#prefix_div_el;
  }

  /**
   * ADD DOCS
   */
  get_postfix_div_element() {
    return this.#postfix_div_el;
  }

  /**
   * ADD DOCS
   */
  get_control_div_element() {
    return this.#control_div_el;
  }

  /**
   * Extends the parent method
   */
  _create_element() {
    const el = super._create_element();

    this.#prefix_div_el = this.constructor.html('<div name="prefix"></div>');
    el.append(this.#prefix_div_el);
    this.#input_div_el = this.constructor.html('<div name="input" class="flex-fill"></div>');
    el.append(this.#input_div_el);
    this.#control_div_el = this.constructor.html('<div name="control"></div>');
    this.#input_div_el.append(this.#control_div_el);
    this.#error_div_el = this.constructor.html('<div name="error" class="text-danger"></div>');
    this.#input_div_el.append(this.#error_div_el);
    this.#postfix_div_el = this.constructor.html('<div name="postfix"></div>');
    el.append(this.#postfix_div_el);

    if (!CN_common.is_function(this._create_control_element)) {
      throw new Error("Tried to create input but _create_control_element has not been implemented.");
    }
    this.#control_el = this._create_control_element(el);
    if (this.#control_id) this.#control_el.setAttribute("id", this.#control_id);
    if (this.#control_name) this.#control_el.setAttribute("name", this.#control_name);
    this.update();
    this.set_value(
      this.has_config("get_default") ?
      this.get_config("get_default")(this.#action ? this.#action.get_model() : null) :
      null
    );
    this.#control_div_el.append(this.#control_el);

    if (this.#event_listeners) {
      // only listen to input events if there's a function to do so with
      if (this.has_config("on_input")) {
        this.#control_el.addEventListener("input", async () => {
          await this.get_config("on_input")(this);
        });
      }

      // validate and call on_change function when the value changes
      this.#control_el.addEventListener("change", async () => {
        // always validate the input
        const valid = this.validate();

        // call the on_change function if it exists
        if (this.has_config("on_change")) {
          await this.get_config("on_change")(this, valid);
        }
      });
    }

    // append the control and add prefix and postfix elements
    if (this.has_config("prefix")) {
      const prefix = this.get_config("prefix");
      if (!CN_common.is_function(prefix)) {
        throw new Error('Form input "prefix" config must be a function.');
      }
      prefix(this.#prefix_div_el);
    }
    if (this.has_config("postfix")) {
      const postfix = this.get_config("postfix");
      if (!CN_common.is_function(postfix)) {
        throw new Error('Form input "postfix" config must be a function.');
      }
      postfix(this.#postfix_div_el);
    }

    if (this.#control_id) this.#control_el.setAttribute("id", this.#control_id);
    if (this.has_config("title")) {
      this.#control_el.setAttribute("aria-label", this.get_config("title"));
    }
    if (this.has_config("placeholder")) {
      this.#control_el.setAttribute("placeholder", this.get_config("placeholder"));
    }
    if (this.has_config("max_length")) {
      this.#control_el.setAttribute("max_length", this.get_config("max_length"));
    }

    return el;
  }

  /**
   * ADD DOCS
   */
  async on_dom_add() {
    await super.on_dom_add();

    // bind the control to the state
    if (this.#state && !this.#state.is_bound()) {
      this.#state.bind_element(this.#control_el);
    }
  }

  /**
   * ADD DOCS
   */
  get_value() {
    return this.#state.is_bound() ? this.#state.get() : this.#control_el.value;
  }

  /**
   * ADD DOCS
   */
  async get_value_for_record() {
    const value = this.get_value();
    return "" === value ? null : value;
  }

  /**
   * ADD DOCS
   */
  set_value(value) {
    if (this.#state.is_bound()) {
      this.#state.set(value);
    } else {
      this.#control_el.value = value;
    }
  }

  /**
   * ADD DOCS
   */
  commit_value() {
    this.#state.commit();
  }

  /**
   * ADD DOCS
   */
  clear_value() {
    this.#state.clear();
  }

  /**
   * ADD DOCS
   */
  undo_value(committed = false) {
    this.#state.undo(committed);
  }

  /**
   * ADD DOCS
   */
  async update() {
  }

  /**
   * Determines if there was an error
   * @return boolean
   */
  validate() {
    const value = this.get_value();
    let error = null;

    if ([undefined, null, ""].includes(value)) {
      // the value is empty, so just make sure it isn't required
      if (this.get_config("required")) error = "Can't be empty";
    } else {
      // check the value's length
      if (this.has_config("min_length")) {
        const min_length = this.get_config("min_length");
        if (String(value).length < min_length) {
          error = `Must be at least ${min_length} characters long`;
        }
      } else if (this.has_config("max_length")) {
        const max_length = this.get_config("max_length");
        if (String(value).length > max_length) {
          error = `Must be at no more than ${max_length} characters long`;
        }
      } else {
        // test the implicit regex
        let re = null;
        if (this.has_config("format")) {
          const format = this.get_config("format");
          if ("alphanum" == format) re = /^[a-zA-Z0-9]+$/;
          else if ("alpha_num" == format) re = /^[a-zA-Z0-9_]+$/;
          else if ("identifier" == format) re = /^[^;=\/]+$/;
        }

        if (re && !re.test(value)) {
          error = "Invalid format";
        }

        // test the explicit regex
        if (null == error && this.has_config("regex")) {
          const regex = this.get_config("regex");
          // the regex may be a string or array of strings
          let regex_list = CN_common.is_array(regex) ? regex : [regex];
          for (let i = 0; i < regex_list.length; i++) {
            let re = new RegExp(regex_list[i]);
            if (!re.test(value)) {
              error = "Invalid format";
              break;
            }
          }
        }
      }
    }

    // show any errors
    if (null == error) {
      this.hide_error();
    } else {
      this.show_error(error, this.get_config("error_timeout"));
    }

    return null == error;
  }

  /**
   * ADD DOCS
   */
  set_disabled(disabled) {
    this.#control_el.disabled = disabled;
  }

  /**
   * ADD DOCS
   */
  flash_border() {
    const old_style = this.#control_el.style;
    this.#control_el.style["border-color"] = "green";
    setTimeout(() => { this.#control_el.style = old_style; }, 500);
  }

  /**
   * ADD DOCS
   */
  async show_error(error, time = 4000) {
    // ignore the request if the error div hasn't been created yet
    if (!this.#error_div_el) return;

    Object.assign(this.#control_el.style, {
      "border-color": "red",
      "border-width": "3px",
      margin: "-2px",
    });

    if (error) this.#error_div_el.innerHTML = error;

    if (0 < time) {
      await CN_common.sleep(time);
      this.hide_error();
    }
  }

  /**
   * ADD DOCS
   */
  hide_error() {
    // ignore the request if the error div hasn't been created yet
    if (!this.#error_div_el) return;

    this.#control_el.style.removeProperty("border-color");
    this.#control_el.style.removeProperty("border-width");
    this.#control_el.style.removeProperty("margin");
    this.#error_div_el.innerHTML = "";
  }
}
