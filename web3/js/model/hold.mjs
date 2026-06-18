import { CN_action_add } from "../action/add.mjs"
import { CN_action_view } from "../action/view.mjs"
import { CN_api } from "../api.mjs"
import { CN_base_model } from "./base_model.mjs"
import { CN_modal_message } from "../modal/message.mjs"

export class CN_model_hold extends CN_base_model {
  constructor() {
    super({
      wording: {
        singular: "hold",
        plural: "holds",
        posessive: "hold's",
      },
      columns: {
        type: { title: "Type", column: "hold_type.type" },
        name: { title: "Name", column: "hold_type.name" },
        datetime: { title: "Date & Time", type: "datetime" },
      },
      properties: {
        hold_type_id: {
          title: "Hold Type",
          type: "enum",
          enum: {
            path: "hold_type",
            select: { column: [
              "access", // needed for the current_role_has_hold_type statement below
              {
                column: "CONCAT(hold_type.type, ': ', hold_type.name)",
                alias: "name",
                table_prefix: false,
              },
              {
                // here, "current_role_has_hold_type.hold_type_id IS NULL" determines if the role has access
                column: "hold_type.system OR current_role_has_hold_type.hold_type_id IS NULL",
                alias: "disabled",
                table_prefix: false,
              }
            ]},
          },
          help: "If empty then the previous hold is cancelled.",
        },
        datetime: {
          title: "Date & Time",
          type: "datetime",
          get_max: () => new Date(),
          is_hidden: (model) => "add" == model.get_action_name(),
        },
        user: {
          title: "User",
          meta: {
            column: "CONCAT(user.first_name, ' ', user.last_name, ' (', user.name, ')')",
            table_prefix: false,
          },
          is_hidden: (model) => "add" == model.get_action_name(),
        },
        site: {
          title: "Site",
          meta: { table: "site", column: "name" },
          is_hidden: (model) => "add" == model.get_action_name(),
        },
        role: {
          title: "Role",
          meta: { table: "role", column: "name" },
          is_hidden: (model) => "add" == model.get_action_name(),
        },
        application: {
          title: "Application",
          meta: { table: "application", column: "title" },
          is_hidden: (model) => "add" == model.get_action_name(),
        },
        note: { title: "Note", type: "text" },
      },
    });
  }
}

export class CN_add_hold extends CN_action_add {
  /**
   * Extends the parent method
   */
  async on_submit() {
    // show extra instructions when creating a deceased hold
    let deceased_hold_type_id = null;
    try {
      deceased_hold_type_id = (await CN_api.get(
        "hold_type/type=final;name=Deceased",
        { select: { column: "id" } }
      )).id;
    } catch (error) {
      // ignore 404
      if (404 != error.response.status) throw error;
    }

    if (deceased_hold_type_id == this.get_property_value("hold_type_id")) {
      await CN_modal_message.create_and_open({
        title: "Date of Death",
        size: "lg",
        message: `
          <div class="pb-2">
            You have choosen to put the participant in a "Deceased" hold and you will now be returned to the
            participant's file.
          </div>
          <div>
            If you have any information about the participant's date of death please enter it in the participant's
            defining details including whether only the year, year and month, or full date is known.
          </div>
        `,
      });
    }

    await super.on_submit();
  }
}

export class CN_view_hold extends CN_action_view {
  /**
   * Extends the parent method
   */
  async get_text(type) {
    if (["crumb", "name"].includes(type)) {
      await this.after_first_load();
      const hold_type = this.get_property("hold_type_id").form_input.get_config("enum").values.find(
        e => e.key == this.get_property_value("hold_type_id")
      );
      return null == hold_type ? "Removed" : hold_type.value;
    }
    return await super.get_text(type);
  }
}
