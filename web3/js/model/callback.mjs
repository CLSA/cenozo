import { CN_model_base } from "./base_model.mjs"
import { CN_session } from "../session.mjs"

export class CN_model_callback extends CN_model_base {
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
        on_click_event: async (event) => {
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
