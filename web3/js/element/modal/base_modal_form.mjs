import CN_api from "../../api.mjs"
import CN_common from "../../common.mjs"
import CN_session from "../../session.mjs"

import { CN_base_modal } from "./base_modal.mjs"

import { CN_input } from "../input/input.mjs";
import { CN_element_label } from "../label.mjs";

export class CN_base_modal_form extends CN_base_modal {
  #input_list = [];

  constructor(config) {
    if (!CN_common.is_object(config)) {
      throw new Error("Non-object config argument passed to CN_base_modal_form contructor");
    }

    super(config);

    // always check the form when opening the form modal
    this.add_modal_event_listener("shown", this.check_form.bind(this));
  }

  /**
   * ADD DOCS
   */
  add_input(type, name, title, config = {}) {
    this.#input_list.push({ type, name, title, config });
  }

  /**
   * ADD DOCS
   */
  get_input(name) {
    return this.#input_list.find(i => i.name == name);
  }

  /**
   * ADD DOCS
   */
  get_input_value(name) {
    const input = this.get_input(name);
    return input ? input.form_input.get_value() : null;
  }

  /**
   * ADD DOCS
   */
  check_form() {
    return !this.#input_list.some(e => !e.form_input.validate());
  }

  /**
   * ADD DOCS
   */
  set_disabled(disabled) {
    super.set_disabled(disabled);
    this.#input_list.forEach(input => input.form_input.set_disabled(disabled));
  }

  /**
   * Implements the parent method
   */
  _create_body_element() {
    const body_el = this.constructor.html(`
      <div>
        <div name="description"></div>
        <hr />
        <div name="inputs"></div>
      </div>
    `);

    // create form elements
    this.#input_list.forEach(input => {
      // create the config
      const config = {
        ...{ // default configuration
          id: ["cn-" + input.name, CN_common.get_random_hex_identifier()].join("-"),
          name: input.name,
          required: true,
          class: "d-flex align-items-center col-sm-9",
          on_change: (form_input, valid) => this.check_form(),
        },
        ...input.config,
      };

      // add the label
      const el = this.constructor.html('<div class="row mb-3"></div>');
      const label_el = CN_element_label.create({ for: config.id, value: input.title });
      label_el.classList.add("col-sm-3");
      el.append(label_el);

      // add the input
      input.form_input = CN_input.create(input.type, config);
      input.form_input.set_parent_element(el);
      el.append(input.form_input.render());
      body_el.querySelector("div[name=inputs]").append(el);

      // if this is a text input update the size after the modal is showing
      this.add_modal_event_listener("shown", () => {
        const value = input.form_input.get_value();
        if (value) {
          const control_el = input.form_input.get_control_element();
          control_el.style.height = "";
          control_el.style.height = control_el.scrollHeight + "px";
        }
      });
    });

    return body_el;
  }
}
