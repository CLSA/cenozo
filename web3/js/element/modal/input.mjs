import { CN_common } from "../../common.mjs"
import { CN_modal_base_form } from "./base_form.mjs"

export class CN_modal_input extends CN_modal_base_form {
  constructor(config) {
    if (!CN_common.is_object(config)) {
      throw new Error("Non-object config argument passed to CN_modal_account contructor");
    }

    super({
      ...{
        // default config
        input: "string",
        title: "Please Provide Input",
        message: "Enter Value",
        cancel_text: "Cancel",
        ok_text: "OK",
      },
      ...config
    });

    const input_config = {};
    if (this.has_config("value")) input_config.get_default = () => this.get_config("value");
    if (this.has_config("required")) input_config.required = this.get_config("required");

    this.add_input(this.get_config("input"), "input", this.get_config("message"), input_config);

    // add the resolve buttons
    this.add_resolve_button("light", this.get_config("cancel_text"), () => this._resolve(undefined));
    this.add_resolve_button("success", this.get_config("ok_text"), async () => {
      this._resolve(this.get_input("input").form_input.get_value_for_record());
    });
  }

  /**
   * Extend parent method
   */
  _check_form() {
    const check = super._check_form();
    const ok_btn_el = this.get_resolve_button(this.get_config("ok_text")).element;
    if (check) {
      ok_btn_el.removeAttribute("disabled");
    } else {
      ok_btn_el.setAttribute("disabled", true);
    }

    return check;
  }

  /**
   * Extend parent method
   */
  _create_body_element() {
    const body_el = super._create_body_element();

    // restructure the form's layout so the label is left-aligned and over the input box
    body_el.querySelector("hr").remove();
    body_el.querySelector("label").classList = "col-form-label";
    this.get_input("input").form_input.get_element().classList.remove("col-sm-9");

    return body_el;
  }
}
