import { CN_action_view } from "../action/view.mjs"
import { CN_base_model } from "./base_model.mjs"
import { CN_common } from "../common.mjs"
import { CN_session } from "../session.mjs"

export class CN_model_form extends CN_base_model {
  constructor() {
    super({
      wording: {
        singular: "form",
        plural: "forms",
        posessive: "form's",
      },
      columns: {
        form_type: {
          column: "form_type.title",
          title: "Form Type",
        },
        uid: {
          column: "participant.uid",
          title: "UID",
        },
        date: { title: "Date", type: "date" },
      },
      properties: {
        form_type: {
          title: "Form Type",
          meta: { table: "form_type", column: "title" },
        },
        date: { title: "Date", type: "date", get_max: () => CN_common.get_date() },
        participant_id: { is_hidden: () => true },
      },
    });
  }
}

export class CN_view_form extends CN_action_view {
  /**
   * Extends the parent method
   */
  async get_text(type) {
    if ("crumb" == type) {
      return this.get_property_value("form_type");
    }

    return await super.get_text(type);
  }
}
