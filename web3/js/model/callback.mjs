import { CN_base_model } from "./base_model.mjs"

export class CN_callback_model extends CN_base_model {
  constructor() {
    super({
      wording: {
        singular: "callback",
        plural: "callbacks",
        posessive: "callback's",
      },
    });
  }

  /**
   * Replace parent method
   */
  allow_list() { return false; }

  /**
   * Replace parent method
   */
  allow_view() { return false; }
}
