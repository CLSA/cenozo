import { CN_base_model } from "./base_model.mjs"
import { CN_common } from "../common.mjs"
import { CN_session } from "../session.mjs"

export class CN_model_phone_call extends CN_base_model {
  constructor() {
    super({
      wording: {
        singular: "phone call",
        plural: "phone calls",
        posessive: "phone call's",
      },
      columns: {
        person: { title: "Person", is_hidden: () => !CN_session.get("setting", "proxy"), table_prefix: false },
        phone: { column: "phone.type", title: "Phone" },
        start_datetime: { title: "Start", type: "datetimesecond", get_max: () => CN_common.get_date() },
        end_datetime: { title: "End", type: "datetimesecond", get_max: () => CN_common.get_date() },
        status: { title: "Status" },
      },
    });
  }

  /**
   * Extend parent method
   */
  allow_add() {
    return false;
  }

  /**
   * Extend parent method
   */
  allow_delete() {
    return false;
  }
}
