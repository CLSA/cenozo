import { CN_base_model } from "./base_model.mjs"
import { CN_common } from "../common.mjs"
import { CN_session } from "../session.mjs"

export class CN_model_alternate_consent extends CN_base_model {
  constructor() {
    super({
      wording: {
        singular: "alternate consent",
        plural: "alternate consents",
        posessive: "alternate consent's",
      },
      columns: {
        alternate_consent_type: {
          column: "alternate_consent_type.name",
          title: "Alternate Consent Type",
        },
        accept: { title: "Accept", type: "boolean" },
        written: { title: "Written", type: "boolean" },
        datetime: { title: "Date & Time", type: "datetime" },
      },
      properties: {
        alternate_consent_type_id: {
          title: "Consent Type",
          type: "enum",
          enum: { path: "alternate_consent_type" },
          is_constant: () => "view" == this.get_action_name(),
        },
        accept: {
          title: "Accept",
          type: "boolean",
          is_constant: () => "view" == this.get_action_name(),
        },
        written: {
          title: "Written",
          type: "boolean",
          is_constant: () => "view" == this.get_action_name(),
          is_hidden: () => 3 > CN_session.get("role", "tier"),
        },
        datetime: { title: "Date & Time", type: "datetimesecond", get_max: () => CN_common.get_date() },
        note: { title: "Note", type: "text" },
      },
    });
  }
}
