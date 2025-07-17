import CN_element from "../element.mjs"
import CN_session from "../session.mjs"

import { CN_base_model } from "../base_model.mjs"
import { CN_base_list } from "../base_list.mjs"

export class CN_form_association_model extends CN_base_model {
  constructor() {
    super({
      wording: {
        singular: "form association",
        plural: "form associations",
        posessive: "form association's",
      },
      columns: {
        subject: { title: "Subject" },
        record_id: { title: "Record ID" },
      },
    });
  }
}

export class CN_form_association_list extends CN_base_list {
  /**
   * Extend parent method to make clicking on an association bring you to that record
   */
  async on_row_click(record) {
    if (this.is_choosing()) {
      await super.on_row_click(record);
    } else {
      const module = CN_session.get_module(record.subject);

      // create the model if it doesn't already exist
      if (!module.get_model()) {
        await module.load_classes();
        module.create_model();
      }

      if (module.action_allowed("view")) {
        await CN_session.navigate_to(module.get_model().get_view_url(record.record_id));
      } else {
        CN_element.modal_message({
          title: "Permission Denied",
          message: `You do not have access to viewing ${module.get_model().get_plural()} records.`,
          type: "danger",
        }).show();
      }
    }
  }
}
