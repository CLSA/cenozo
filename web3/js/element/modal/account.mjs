import CN_api from "../../api.mjs"
import CN_common from "../../common.mjs"
import CN_session from "../../session.mjs"

import { CN_base_modal } from "./base_modal.mjs"

import { CN_input_email } from "../input/email.mjs";
import { CN_input_label } from "../input/label.mjs";
import { CN_input_string } from "../input/string.mjs";

export class CN_modal_account extends CN_base_modal {
  #elements;

  constructor(config = { title: "Account Details" }) {
    if (!CN_common.is_object(config)) {
      throw new Error("Non-object config argument passed to CN_modal_account contructor");
    }

    super(config);

    this.#elements = {
      first_name: { title: "First Name", type: "string" },
      last_name: { title: "Last Name", type: "string" },
      email: { title: "Email", type: "email" },
    };

    // add the resolve buttons
    this.add_resolve_button("light", "Cancel", false);
    this.add_resolve_button("success", "OK", async () => {
      const data = {
        user: {
          first_name: this.#elements.first_name.form_input.get_value(),
          last_name: this.#elements.last_name.form_input.get_value(),
          email: this.#elements.email.form_input.get_value(),
        },
      };
      if (
        CN_session.data.user.first_name != data.user.first_name ||
        CN_session.data.user.last_name != data.user.last_name ||
        CN_session.data.user.email != data.user.email
      ) {
        await this.constructor.wait_for(async () => {
          // update the server
          await CN_api.patch("self/0", data);

          // update the UI
          CN_session.data.user.first_name = data.user.first_name;
          CN_session.data.user.last_name = data.user.last_name;
          CN_session.data.user.email = data.user.email;
        });
      }
      return true;
    });
  }

  /**
   * Implements the parent method
   */
  _create_body_element() {
    const body_el = this.constructor.html(`
      <div>
        <span class="text-info-emphasis">Update your account details here:</span>
        <hr />
        <div name="inputs"></div>
      </div>
    `);

    // create form elements
    for (const element_name in this.#elements) {
      // create the config
      const config = {
        id: ["cn-" + element_name, CN_common.get_random_hex_identifier()].join("-"),
        name: element_name,
        required: true,
        class: "d-flex align-items-center col-sm-9",
        get_default: () => CN_session.data.user[element_name],
        on_change: (control_el, valid) => {
          const ok_btn_el = this.get_resolve_button("OK").element;
          if (valid) {
            ok_btn_el.removeAttribute("disabled");
          } else {
            ok_btn_el.setAttribute("disabled", true);
          }
        },
      };

      // add the label
      const element = this.#elements[element_name];
      const el = this.constructor.html('<div class="row mb-3"></div>');
      const label_el = CN_input_label.create({ for: config.id, value: element.title });
      label_el.classList.add("col-sm-3");
      el.append(label_el);

      // add the input
      element.form_input = "string" == element.type ? new CN_input_string(config) : new CN_input_email(config);
      element.form_input.set_parent_element(el);
      el.append(element.form_input.render());
      body_el.querySelector("div[name=inputs]").append(el);
    }

    return body_el;
  }
}
