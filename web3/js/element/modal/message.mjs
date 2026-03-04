import { CN_common } from "../../common.mjs"
import { CN_base_modal } from "./base_modal.mjs"

export class CN_modal_message extends CN_base_modal {
  constructor(config = {}) {
    if (!CN_common.is_object(config)) {
      throw new Error("Non-object config argument passed to CN_modal_message contructor");
    }

    super({
      ...{
        // default config
        title: "Attention",
        message: "This is a message.",
        ok_text: "OK",
      },
      ...config
    });

    // add the resolve buttons
    this.add_resolve_button("primary", this.get_config("ok_text"), () => this._resolve(true));
  }

  /**
   * Implements the parent method
   */
  _create_body_element() {
    return this.constructor.html(`<span>${this.get_config("message")}</span>`);
  }
}
