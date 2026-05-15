import { CN_base_model } from "./base_model.mjs"
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
        start_datetime: { title: "Start", type: "datetimesecond", max: "now" },
        end_datetime: { title: "End", type: "datetimesecond", max: "now" },
        status: { title: "Status" },
      },
    });
  }
}
