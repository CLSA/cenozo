import CN_session from "../session.mjs"

import { CN_base_model } from "../base_model.mjs"

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
