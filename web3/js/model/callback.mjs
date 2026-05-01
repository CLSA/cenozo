import { CN_base_model } from "./base_model.mjs"
import { CN_session } from "../session.mjs"

export class CN_callback_model extends CN_base_model {
  constructor() {
    super({
      wording: {
        singular: "callback",
        plural: "callbacks",
        posessive: "callback's",
      },
      calendar: {
        select: {
          column: [
            "id", // participant.id
            { column: "uid", alias: "title" },
            { column: "callback", alias: "datetime" },
            { column: "60", alias: "duration", table_prefix: false },
          ],
        },
        modifier: {
          order: ["callback", "uid"],
        },
        on_click: async (event) => {
          await CN_session.navigate_to(`participant/view/${event.id}`);
        },
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
