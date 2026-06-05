import { CN_api } from "../api.mjs"
import { CN_common } from "../common.mjs"
import { CN_modal_base_form } from "./base_form.mjs"

export class CN_modal_password extends CN_modal_base_form {
  constructor(config = {}) {
    if (!CN_common.is_object(config)) {
      throw new Error("Non-object config argument passed to CN_modal_password constructor");
    }

    super({
      ...{
        title: "Change Password",
        force: false,
      },
      ...config
    });

    if (!this.get_config("force")) this.add_input("password", "current_password", "Current Password");
    this.add_input(
      "password",
      "new_password",
      "New Password",
      { min_length: 8, on_input: () => this._check_form() },
    );
    this.add_input(
      "password",
      "new_password_check",
      "Repeat New Password",
      { on_input: () => this._check_form() }
    );

    // add the resolve buttons
    if (!this.get_config("force")) this.add_resolve_button("light", "Cancel", () => this._resolve(false));
    this.add_resolve_button(
      "success",
      "OK",
      async () => {
        const data = {
          user: {
            password: {
              current: (
                this.get_config("force") ?
                null :
                await this.get_input_value_for_record("current_password")
              ),
              requested: await this.get_input_value_for_record("new_password"),
            },
          },
        };

        // update the server
        try {
          this.set_disabled(true);
          await CN_api.patch("self/0", data);
          this._resolve(true);
        } catch (error) {
          if (CN_common.is_object(error) && "invalid password" == error.error_code) {
            this.get_input("current_password").form_input.show_error("The password is incorrect", 0);
          } else {
            throw error;
          }
        } finally {
          this.set_disabled(false);
        }
      },
      true, // submit on enter key
    );
  }

  /**
   * Extend parent method
   */
  async _check_form() {
    const pw_form_input = this.get_input("new_password").form_input;
    const new_pw_form_input = this.get_input("new_password_check").form_input;

    const ok_btn_el = this.get_resolve_button("OK").element;
    if (pw_form_input.get_value() != new_pw_form_input.get_value()) {
      new_pw_form_input.show_error("Does not match new password", 0);
      this.constructor.set_disabled(ok_btn_el, true);
      return false;
    }

    const check = await super._check_form();
    this.constructor.set_disabled(ok_btn_el, !check);
    return check;
  }

  /**
   * Implements the base method
   */
  _create_body_element() {
    const body_el = super._create_body_element();
    body_el.querySelector("div[name=description]").append(this.constructor.html(
      '<div class="text-info-emphasis">Fill out this form to change your password.</div>'
    ));
    body_el.querySelector("div[name=description]").append(this.constructor.html(
      '<div class="text-warning-emphasis">Note that passwords must be at least 8 characters long.</div>'
    ));

    return body_el;
  }
}
