import CN_api from "../../api.mjs"
import CN_common from "../../common.mjs"

import { CN_base_modal } from "./base_modal.mjs"

import { CN_input_label } from "../input/label.mjs";
import { CN_input_password } from "../input/password.mjs";

export class CN_modal_password extends CN_base_modal {
  #elements;

  constructor(config = { title: "Change Password" }) {
    if (!CN_common.is_object(config)) {
      throw new Error("Non-object config argument passed to CN_modal_password contructor");
    }

    super(config);

    this.#elements = {
      current_password: { title: "Current Password" },
      new_password: { title: "New Password" },
      new_password_check: { title: "Repeat New Password" },
    };

    // add the resolve buttons
    this.add_resolve_button("light", "Cancel", false);
    this.add_resolve_button("success", "OK", async () => {
      return false;
      const data = {
        user: {
          password: {
            current_password: this.#elements.current_password.form_input.get_value(),
            new_password: this.#elements.new_password.form_input.get_value(),
          },
        },
      };

      await this.constructor.wait_for(async () => {
        // update the server
        try {
          await CN_api.patch("self/0", data);
        } catch (error) {
          if (CN_common.is_object(error) && "invalid password" == error.error_code) {
            this.toast({
              title: "Password Failed",
              message: "The password you provided as your current password is incorrect.",
              type: "danger",
            });
            return false;
          } else {
            throw error;
          }
        }
      });

      return true;
    });
  }

  _create_body_element() {
    const body_el = this.constructor.html(`
      <div>
        <div class="text-info-emphasis">
          Fill out this form to change your password.
        </div>
        <div class="text-warning-emphasis">
          Note that passwords must be at least 8 characters long.
        </div>
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
        on_change: (form_input, valid) => {
          // see if all inputs are valid
          const ok_btn_el = this.get_resolve_button("OK").element;
          if (this.#elements.some(e => !e.form_input.validate())) {
            ok_btn_el.setAttribute("disabled", true);
          } else {
            ok_btn_el.removeAttribute("disabled");
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
      element.form_input = new CN_input_password(config);
      element.form_input.set_parent_element(el);
      el.append(element.form_input.render());
      body_el.querySelector("div[name=inputs]").append(el);
    }

      /*
      if (data.user.password.new_password !== new_password_check) {
        this.toast({
          title: "Password Mismatch",
          message: "The new passwords do not match.  Please type them again and make sure they are the same.",
          type: "danger",
        });
      } else {
      */

    return body_el;
  }
}
