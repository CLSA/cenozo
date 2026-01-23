import CN_common from "../../common.mjs"
import { CN_base_modal } from "./base_modal.mjs"
import { CN_element } from "../element.mjs";
import { CN_form_label } from "../form_label.mjs";

export class CN_modal_account extends CN_base_modal {
  constructor(config = { title: "Account Details" }) {
    super(config);

    // add the resolve buttons
    this.add_resolve_button("light", "Cancel", false);
    this.add_resolve_button("success", "OK", async () => {
      let first_name = document.getElementById(elements.first_name.el_id).value;
      let last_name = document.getElementById(elements.last_name.el_id).value;
      let email = document.getElementById(elements.email.el_id).value;
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
    const el = CN_element.create(`
      <span class="text-info-emphasis">
        Update your account details here:
      </span>
      <hr />
      <form></form>
    `);

    // create elements
    const elements = {
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

    for (const id in elements) {
      const element = elements[id];
      const el = CN_element.create('<div class="row mb-3"></div>');
      const label_el = (new CN_form_label({ for: element.el_id, value: element.title })).render();
      label_el.classList.add("col-sm-3");
      el.append(label_el);
      const element_el = CN_element.create_form_element(element.type, {
        id: element.el_id,
        required: true,
        on_change: (control_el, valid) => {
          if (valid) {
            ok_btn_el.removeAttribute("disabled");
          } else {
            ok_btn_el.setAttribute("disabled", true);
          }
        },
      });
      element_el.classList.add("col-sm-9");
      el.append(element_el);
      form_el.append(el);
      document.getElementById(element.el_id).value = CN_session.data.user[id];
    }

    return el;
  }
}
