import { CN_model_base } from "./base_model.mjs"
import { CN_session } from "../session.mjs"

export class CN_model_alternate_consent extends CN_model_base {
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
          is_constant: (model) => "view" == model.get_action_name(),
        },
        accept: {
          title: "Accept",
          type: "boolean",
          is_constant: (model) => "view" == model.get_action_name(),
        },
        written: {
          title: "Written",
          type: "boolean",
          is_constant: (model) => "view" == model.get_action_name(),
          is_hidden: () => 3 > CN_session.get("role", "tier"),
        },
        datetime: { title: "Date & Time", type: "datetimesecond", max: "now" },
        note: { title: "Note", type: "text" },
      },
    });
  }
}
