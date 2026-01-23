import { CN_base_modal } from "./base_modal.mjs"
import { CN_element } from "../element.mjs";

const default_config = {
  title: "Please Confirm",
  message: "Do you wish to proceed?",
  no_text: "No",
  yes_text: "Yes",
};

export class CN_modal_confirm extends CN_base_modal {
  constructor(config) {
    super({...default_config, ...config});

    // add the resolve buttons
    this.add_resolve_button("light", this.get_config("no_text"), false);
    this.add_resolve_button("success", this.get_config("yes_text"), true);
  }

  /**
   * Implements the parent method
   */
  _create_body_element() {
    return CN_element.create(`<span>${this.get_config("message")}</span>`);
  }
}
