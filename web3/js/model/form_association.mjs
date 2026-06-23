import { CN_action_list } from "../action/list.mjs"
import { CN_api } from "../api.mjs"
import { CN_base_model } from "./base_model.mjs"
import { CN_modal_message } from "../modal/message.mjs"
import { CN_session } from "../session.mjs"

export class CN_model_form_association extends CN_base_model {
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

export class CN_list_form_association extends CN_action_list {
  /**
   * Extend parent method to make clicking on an association bring you to that record
   */
  async on_row_click(record) {
    if (this.is_choosing()) {
      await super.on_row_click(record);
    } else {
      const module = CN_session.get_module(record.subject);

      // Make sure the module's classes have been loaded, then create a new model
      // Note that we don't have to configure it because we're not using it to generate an element
      await module.load_classes();
      const model = module.create_model();

      if (model.allow_view()) {
        let path = model.get_view_url(record.record_id);
        if ("consent" == record.subject) {
          // add the parent participant to the path
          const row = await CN_api.get(
            model.get_view_url(record.record_id, "api"),
            { select: { column: "participant_id" } },
          );
          if (row) path = `participant/view/${row.participant_id}/${path}`;
        } else if ("alternate_consent" == record.subject) {
          // add the parent alternate to the path
          const row = await CN_api.get(
            model.get_view_url(record.record_id, "api"),
            { select: { column: "alternate_id" } },
          );
          if (row) path = `alternate/view/${row.alternate_id}/${path}`;
        }
        await CN_session.navigate_to(path);
      } else {
        await CN_modal_message.create_and_open({
          header_class: "text-bg-danger",
          title: "Permission Denied",
          message: `You do not have access to viewing ${model.get_plural()} records.`,
        });
      }
    }
  }
}
