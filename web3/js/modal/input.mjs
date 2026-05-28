import { CN_common } from "../common.mjs"
import { CN_modal_base_form } from "./base_form.mjs"

export class CN_modal_input extends CN_modal_base_form {
  constructor(config) {
    if (!CN_common.is_object(config)) {
      throw new Error("Non-object config argument passed to CN_modal_input constructor");
    }

    super({
      ...{
        // default config
        title: "Please Provide Input",
        message: "Enter Value",
        cancel_text: "Cancel",
        ok_text: "OK",
        input: {
          // default input config
          ...{
            type: "string",
          },
          ...config.input,
        },
      },
      ...config
    });

    // remove the type from the input config (so it doesn't conflict with the input's type config)
    const input = this.get_config("input");
    const type = input.type;
    delete input.type;

    this.add_input(type, "input", this.get_config("message"), input);

    // add the resolve buttons
    this.add_resolve_button("light", this.get_config("cancel_text"), () => this._resolve(undefined));
    this.add_resolve_button(
      "success",
      this.get_config("ok_text"),
      () => this._resolve(this.get_input("input").form_input.get_value_for_record()),
      true, // submit on enter key
    );
  }

  /**
   * Extend parent method
   */
  async _check_form() {
    const check = await super._check_form();
    this.constructor.set_disabled(this.get_resolve_button(this.get_config("ok_text")).element, !check);
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
