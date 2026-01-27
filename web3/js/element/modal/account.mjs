import CN_api from "../../api.mjs"
import CN_common from "../../common.mjs"
import CN_session from "../../session.mjs"

import { CN_base_modal } from "./base_modal.mjs"
import { CN_form_element } from "../form_element.mjs";
import { CN_form_label } from "../form/label.mjs";

export class CN_modal_account extends CN_base_modal {
  #elements;

  constructor(config = { title: "Account Details" }) {
    super(config);

    this.#elements = {
      first_name: {
        el_id: ["cn-first-name", CN_common.get_random_hex_identifier()].join("-"),
        title: "First Name",
        type: "string",
      },
      last_name: {
        el_id: ["cn-last-name", CN_common.get_random_hex_identifier()].join("-"),
        title: "Last Name",
        type: "string",
      },
      email: {
        el_id: ["cn-email", CN_common.get_random_hex_identifier()].join("-"),
        title: "Email",
        type: "email",
      },
    };

    // add the resolve buttons
    this.add_resolve_button("light", "Cancel", false);
    this.add_resolve_button("success", "OK", async () => {
      let first_name = document.getElementById(this.#elements.first_name.el_id).value;
      let last_name = document.getElementById(this.#elements.last_name.el_id).value;
      let email = document.getElementById(this.#elements.email.el_id).value;
      if (
        CN_session.data.user.first_name != first_name ||
        CN_session.data.user.last_name != last_name ||
        CN_session.data.user.email != email
      ) {
        await this.wait_for(async () => {
          // update the server
          await CN_api.patch("self/0", {
            user: {
              first_name: first_name,
              last_name: last_name,
              email: email,
            },
          });

          // update the UI
          CN_session.data.user.first_name = first_name;
          CN_session.data.user.last_name = last_name;
          CN_session.data.user.email = email;
        });

        return true;
      }
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
        <form></form>
      </div>
    `);

    // create elements
    for (const element_name in this.#elements) {
      const element = this.#elements[element_name];
      const el = this.constructor.html('<div class="row mb-3"></div>');
      const label_el = CN_form_label.create({ for: element.el_id, value: element.title });
      label_el.classList.add("col-sm-3");
      el.append(label_el);
      const form_element = new CN_form_element(element.type, {
        id: element.el_id,
        name: element_name,
        required: true,
        on_change: (control_el, valid) => {
          const ok_btn_el = el.querySelector("[name=OK]");
          if (valid) {
            ok_btn_el.removeAttribute("disabled");
          } else {
            ok_btn_el.setAttribute("disabled", true);
          }
        },
      });
      const element_el = form_element.render();
      element_el.classList.add("col-sm-9");
      element_el.querySelector("input").value = CN_session.data.user[element_name];
      el.append(element_el);
      body_el.querySelector("form").append(el);
    }

    return body_el;
  }
}
