import { CN_common } from "../common.mjs"
import { CN_modal_base_form } from "./base_form.mjs"
import { CN_session } from "../session.mjs"

export class CN_modal_account extends CN_modal_base_form {
  constructor(config = { title: "Account Details" }) {
    if (!CN_common.is_object(config)) {
      throw new Error("Non-object config argument passed to CN_modal_account constructor");
    }

    super(config);

    this.add_input(
      "string",
      "first_name",
      "First Name",
      { get_default: () => CN_session.get("user", "first_name") }
    );
    this.add_input(
      "string",
      "last_name",
      "Last Name",
      { get_default: () => CN_session.get("user", "last_name") }
    );
    this.add_input(
      "email",
      "email",
      "Email",
      { get_default: () => CN_session.get("user", "email") }
    );

    // add the resolve buttons
    this.add_resolve_button("light", "Cancel", () => this._resolve(null));
    this.add_resolve_button("success", "OK", async () => {
      this._resolve({
        first_name: await this.get_input_value_for_record("first_name"),
        last_name: await this.get_input_value_for_record("last_name"),
        email: await this.get_input_value_for_record("email"),
      });
    });
  }

  /**
   * Extend parent method
   */
  async _check_form() {
    const check = await super._check_form();
    this.constructor.set_disabled(this.get_resolve_button("OK").element, !check);
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
