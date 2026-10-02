import { CN_action_view } from "../action/view.mjs"
import { CN_base_model } from "./base_model.mjs"
import { CN_common } from "../common.mjs"
import { CN_session } from "../session.mjs"

export class CN_model_consent extends CN_base_model {
  constructor() {
    super({
      wording: {
        singular: "consent",
        plural: "consents",
        posessive: "consent's",
      },
      columns: {
        consent_type: { column: "consent_type.name", title: "Type" },
        accept: { title: "Accept", type: "boolean" },
        written: { title: "Written", type: "boolean" },
        datetime: { title: "Date & Time", type: "datetime" },
      },
      properties: {
        consent_type_id: {
          title: "Consent Type",
          type: "enum",
          enum: {
            path: "consent_type",
            select: { column: [
              "access", // needed for the current_role_has_consent_type statement below
              "name",
              {
                // here, "current_role_has_consent_type.consent_type_id IS NULL" determines if the role has access
                column: "current_role_has_consent_type.consent_type_id IS NULL",
                alias: "disabled",
                table_prefix: false,
              },
            ]},
          },
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
        consent_type: {
          meta: { table: "consent_type", column: "name" },
          is_hidden: () => true,
        },
      },
    });
  }
}

export class CN_view_consent extends CN_action_view {
  /**
   * Extends the parent method
   */
  async get_text(type) {
    if ("crumb" == type) {
      return this.get_property_value("consent_type");
    }

    return await super.get_text(type);
  }
}
