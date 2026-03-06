import { CN_api } from "../../api.mjs"
import { CN_common } from "../../common.mjs"
import { CN_modal_base_form } from "./base_form.mjs"
import { CN_session } from "../../session.mjs"

export class CN_modal_account extends CN_modal_base_form {
  constructor(config = { title: "Account Details" }) {
    if (!CN_common.is_object(config)) {
      throw new Error("Non-object config argument passed to CN_modal_account contructor");
    }

    super(config);

    this.add_input("string", "first_name", "First Name", { get_default: () => CN_session.data.user.first_name });
    this.add_input("string", "last_name", "Last Name", { get_default: () => CN_session.data.user.last_name });
    this.add_input("email", "email", "Email", { get_default: () => CN_session.data.user.email });

    // add the resolve buttons
    this.add_resolve_button("light", "Cancel", () => this._resolve(false));
    this.add_resolve_button("success", "OK", async () => {
      const data = {
        user: {
          first_name: this.get_input_value("first_name"),
          last_name: this.get_input_value("last_name"),
          email: this.get_input_value("email"),
        },
      };
      if (
        CN_session.data.user.first_name != data.user.first_name ||
        CN_session.data.user.last_name != data.user.last_name ||
        CN_session.data.user.email != data.user.email
      ) {
        // update the server
        try {
          this.set_disabled(true);
          await CN_api.patch("self/0", data);

          // update the UI
          CN_session.data.user.first_name = data.user.first_name;
          CN_session.data.user.last_name = data.user.last_name;
          CN_session.data.user.email = data.user.email;
        } finally {
          this.set_disabled(false);
        }
      }
      this._resolve(true);
    });
  }

  /**
   * Extend parent method
   */
  _check_form() {
    const check = super._check_form();
    const ok_btn_el = this.get_resolve_button("OK").element;
    if (check) {
      ok_btn_el.removeAttribute("disabled");
    } else {
      ok_btn_el.setAttribute("disabled", true);
    }

    return check;
  }

  /**
   * Implements the parent method
   */
  _create_body_element() {
    const body_el = super._create_body_element();
    body_el.querySelector("div[name=description]").append(this.constructor.html(
      '<div class="text-info-emphasis">Update your account details here:</div>'
    ));

    return body_el;
  }
}
