import { CN_base_element } from "../element/base_element.mjs"
import { CN_common } from "../common.mjs"
import { CN_state } from "../state.mjs"

/**
 * Bass class for all input elements
 * @event setvalue: ran when the input's value is set
 * @event commitvalue: ran when the input's value is committed
 * @event clearvalue: ran when the input's value is cleared
 * @event undovalue: ran when the input's value is undone
 */
export class CN_base_input extends CN_base_element {
  #action;
  #state;
  #record_state;
  #control_id;
  #control_name;
  #control_el;
  #prefix_div_el;
  #input_div_el;
  #control_div_el;
  #error_div_el;
  #postfix_div_el;
  #undo_btn_el;
  #event_listeners = true;

  /**
   * Base class for all inputs
   * @param object config: A set of key/value pairs containing all of the input's configuration parameters
   */
  constructor(parent_el, config = {}) {
    if (!CN_common.is_object(config)) {
      throw new Error("Non-object config argument passed to CN_base_input constructor");
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
        required: false,
        disabled: false,
        undo: false,
      },
      ...config
    });

    if ("CN_base_input" == this.constructor) {
      throw new Error("Abstract class CN_base_input can't be instantiated.");
    }

    this.#action = action;
    this.#control_id = id;
    this.#control_name = name;
    this.#state = new CN_state(value => this._calculate_value_for_record(value));
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
   * ADD DOCS
   */
  async on_dom_add() {
    await super.on_dom_add();

    // bind the control to the state
    if (!this.#state.is_bound()) this.#state.bind_element(this.#control_el);
  }

  /**
   * ADD DOCS
   */
  get_value() {
    return this.#state.get();
  }

  /**
   * ADD DOCS
   */
  async get_value_for_record() {
    return await this.#state.get_for_record();
  }

  /**
   * ADD DOCS
   */
  async set_value(value, value_for_record = undefined) {
    // check if the value has a prefix or postfix
    if (value) {
      const prefix = await this._get_value_prefix();
      const postfix = await this._get_value_postfix();
      if (
        (CN_common.is_string(prefix) && 0 < prefix.length) ||
        (CN_common.is_string(postfix) && 0 < postfix.length)
      ) {
        if (CN_common.is_string(prefix) && 0 < prefix.length) value = prefix + value;
        if (CN_common.is_string(postfix) && 0 < postfix.length) value = value + postfix;
      }
    }

    this.#state.set(value, value_for_record);

    if (this.get_config("undo") && this.#undo_btn_el) {
      if (this.#state.can_undo()) {
        this.#undo_btn_el.classList.remove("d-none");
      } else {
        this.#undo_btn_el.classList.add("d-none");
      }
    }

    this.run_event_listeners("setvalue");
  }

  /**
   * ADD DOCS
   */
  commit_value() {
    this.#state.commit();

    if (this.get_config("undo") && this.#undo_btn_el) {
      if (this.#state.can_undo()) {
        this.#undo_btn_el.classList.remove("d-none");
      } else {
        this.#undo_btn_el.classList.add("d-none");
      }
    }

    this.run_event_listeners("commitvalue");
  }

  /**
   * ADD DOCS
   */
  clear_value() {
    this.#state.clear();

    if (this.get_config("undo") && this.#undo_btn_el) {
      if (this.#state.can_undo()) {
        this.#undo_btn_el.classList.remove("d-none");
      } else {
        this.#undo_btn_el.classList.add("d-none");
      }
    }

    this.run_event_listeners("clearvalue");
  }

  /**
   * ADD DOCS
   */
  undo_value(committed = false) {
    const data = { was_committed: this.#state.is_committed() };
    this.#state.undo(committed);
    data.is_committed = this.#state.is_committed();

    if (this.get_config("undo") && this.#undo_btn_el) {
      if (this.#state.can_undo()) {
        this.#undo_btn_el.classList.remove("d-none");
      } else {
        this.#undo_btn_el.classList.add("d-none");
      }
    }

    this.run_event_listeners("undovalue", data);
  }

  /**
   * ADD DOCS
   */
  async update() {}

  /**
   * Determines if there was an error
   * @return boolean
   */
  async validate() {
    const value = await this.get_value_for_record();
    let error = null;

    if ([undefined, null, ""].includes(value)) {
      // the value is empty, so just make sure it isn't required
      if (this.get_config("required")) error = "Can't be empty";
    } else {
      // check the value's length
      if (null == error && this.has_config("min_length")) {
        const min_length = this.get_config("min_length");
        if (String(value).length < min_length) {
          error = `Must be at least ${min_length} characters long`;
        }
      }

      if (null == error && this.has_config("max_length")) {
        const max_length = this.get_config("max_length");
        if (String(value).length > max_length) {
          error = `Must be at no more than ${max_length} character${1 == max_length ? "" : "s"} long`;
        }
      }

      // test the implicit regex
      if (null == error && this.has_config("format")) {
        let re = null;
        const format = this.get_config("format");
        if ("alphanum" == format) re = /^[a-zA-Z0-9]+$/;
        else if ("alpha_num" == format) re = /^[a-zA-Z0-9_]+$/;
        else if ("identifier" == format) re = /^[^;=\/]+$/;
        if (re && !re.test(value)) error = "Invalid format";
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
    this.set_config("disabled", disabled);
    this.constructor.set_disabled(this.#control_el, disabled);

    if (this.get_config("undo") && this.#undo_btn_el) {
      if (!disabled && this.#state.can_undo()) {
        this.#undo_btn_el.classList.remove("d-none");
      } else {
        this.#undo_btn_el.classList.add("d-none");
      }
    }
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

  /**
   * ADD DOCS
   */
  async _get_value_prefix() { return ""; }

  /**
   * ADD DOCS
   */
  async _get_value_postfix() { return ""; }

  /**
   * ADD DOCS
   */
  async _calculate_value_for_record(value) {
    return "" === value ? null : value;
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
    this.set_disabled(this.get_config("disabled"));

    // set the value to the default (only if it hasn't been set yet)
    if (null === this.get_value() && this.has_config("get_default")) {
      const default_value = this.get_config("get_default")(this.#action ? this.#action.get_model() : null);
      this.set_value(default_value);
    }
    this.#control_div_el.append(this.#control_el);

    this.update();

    if (this.#event_listeners) {
      // only listen to focus events if there's a function to do so with
      if (this.has_config("on_focus")) {
        this.#control_el.addEventListener("focus", async () => {
          await this.get_config("on_focus")(this);
        });
      }

      // only listen to input events if there's a function to do so with
      if (this.has_config("on_input")) {
        this.#control_el.addEventListener("input", async () => {
          await this.get_config("on_input")(this);
        });
      }

      // validate and call on_change function when the value changes
      this.#control_el.addEventListener("change", async () => {
        // always validate the input
        const valid = await this.validate();

        // call the on_change function if it exists
        if (this.has_config("on_change")) {
          await this.get_config("on_change")(this, valid);
        }
      });
    }

    // add the undo button if enabled
    if (this.get_config("undo")) {
      this.#undo_btn_el = this.constructor.html(
        '<button type="button" name="undo" class="btn btn-warning ms-2 d-none">Undo</button>'
      );
      this.#undo_btn_el.addEventListener("click", this.undo_value.bind(this, true));
      this.#postfix_div_el.append(this.#undo_btn_el);
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
}
