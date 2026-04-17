import { CN_action_list } from "../action/list.mjs"
import { CN_base_model } from "./base_model.mjs"
import { CN_session } from "../session.mjs"

export class CN_form_model extends CN_base_model {
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

        // needed by the CN_form_list.on_row_click() method below
        form_type_id: { is_hidden: () => true }
      },
      properties: {
        form_type_id: {
          title: "Form Type",
          type: "enum",
          enum: { path: "form_type" },
        },
        date: { title: "Date", type: "date", max: "now" },
      },
    });
  }
}

export class CN_form_list extends CN_action_list {
  async on_row_click(record) {
    if (!this.is_choosing() && this.get_model().allow_view()) {
      // always view forms using the form_type as the parent
      await CN_session.navigate_to(`form_type/view/${record.form_type_id}/form/view/${record.id}`);
    } else {
      await super.on_row_click(record);
    }
  }
}
