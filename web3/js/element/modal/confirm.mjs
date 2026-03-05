import { CN_base_modal } from "./base_modal.mjs"
import { CN_common } from "../../common.mjs"

export class CN_modal_confirm extends CN_base_modal {
  constructor(config = {}) {
    if (!CN_common.is_object(config)) {
      throw new Error("Non-object config argument passed to CN_modal_confirm contructor");
    }

    super({
      ...{
        // default config
        title: "Please Confirm",
        message: "Do you wish to proceed?",
        no_text: "No",
        yes_text: "Yes",
      },
      ...config
    });

    // add the resolve buttons
    this.add_resolve_button("light", this.get_config("no_text"), () => this._resolve(false));
    this.add_resolve_button("success", this.get_config("yes_text"), () => this._resolve(true));
  }

  /**
   * Implements the parent method
   */
  _create_body_element() {
    return this.constructor.html(`<span>${this.get_config("message")}</span>`);
  }
}
