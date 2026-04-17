import { CN_action_add } from "../action/add.mjs"
import { CN_action_report_view } from "../action/report_view.mjs"
import { CN_api } from "../api.mjs"
import { CN_base_model } from "./base_model.mjs"
import { CN_session } from "../session.mjs"

export class CN_report_model extends CN_base_model {
  constructor() {
    super({
      wording: {
        singular: "report",
        plural: "reports",
        posessive: "report's",
      },
      columns: {
        report_type: { column: "report_type.name", title: "Report Type" },
        report_schedule: { title: "Automatic", type: "boolean", table_prefix: false },
        user: { column: "user.name", title: "User" },
        site: { column: "site.name", title: "Site" },
        role: { column: "role.name", title: "Role" },
        size: { title: "Size", type: "size" },
        stage: { title: "Status" },
        datetime: { title: "Date & Time", type: "datetime" },
      },
      properties: {
        report_schedule: {
          meta: {}, // predefined by the service
          title: "Automatically Generated",
          type: "boolean",
          is_hidden: (model) => "add" == model.get_action_name(),
          is_constant: () => true,
        },
        user: {
          meta: { table: "user", column: "name" },
          title: "User",
          is_hidden: (model) => "add" == model.get_action_name(),
          is_constant: () => true,
        },
        site: {
          meta: { table: "site", column: "name" },
          title: "Site",
          is_hidden: (model) => "add" == model.get_action_name(),
          is_constant: () => true,
        },
        role: {
          meta: { table: "role", column: "name" },
          title: "Role",
          is_hidden: (model) => "add" == model.get_action_name(),
          is_constant: () => true,
        },
        format: {
          title: "Format",
          type: "enum",
          is_constant: () => true,
        },
        stage: {
          title: "Status",
          is_hidden: (model) => "add" == model.get_action_name(),
          is_constant: () => true,
        },
        size: {
          title: "Size",
          type: "size",
          is_hidden: (model) => "add" == model.get_action_name(),
          is_constant: () => true,
        },
        datetime: {
          title: "Date & Time",
          type: "datetimesecond",
          is_hidden: (model) => "add" == model.get_action_name(),
          is_constant: () => true,
        },
        formatted_elapsed: {
          title: "Elapsed",
          meta: {}, // predefined by the service
          is_hidden: (model) => "add" == model.get_action_name(),
          is_constant: () => true,
        },
      },
    });
  }
}

// A private function used by both report_add and report_view
async function create_restriction_inputs(action) {
  const report_type_id = action.get_model().get_parent_model().get_identifier();
  if (report_type_id != action.current_report_type_id) {
    action.current_report_type_id = report_type_id;

    // re-define the report's restrictions
    const response = await CN_api.get(
      `report_type/${action.current_report_type_id}/report_restriction`,
      {
        select: { column: [
          "name",
          "title",
          "mandatory",
          "null_allowed",
          "restriction_type",
          "subject",
          "operator",
          "enum_list",
          "description",
        ] },
        modifier: { order: "rank" },
      },
    );

    if (0 < response.length) {
      action.add_property_group("restrictions", { title: "Report Parameters", open: true });
      response.forEach(prop => {
        // determine the parameters for each restriction type
        const params = {
          title: prop.title,
          meta: {}, // predefined by the service
          required: prop.mandatory,
          is_constant: () => "view" == action.get_type(),
        };
        if (["enum", "table"].includes(prop.restriction_type)) {
          params.type = "enum";
          params.enum = {
            get_enums: async () => {
              const enum_list = (
                "enum" == prop.restriction_type ?
                JSON.parse(`[${prop.enum_list}]`).map(item => ({ key: item, value: item, disabled: false })) :
                await CN_api.get(prop.subject, {
                  select: { column: [{ column: "id", alias: "key" }, { column: "name", alias: "value" }] },
                  modifier: { order: "name", limit: 1000000 },
                })
              );
              if (prop.null_allowed) {
                enum_list.unshift({
                  key: "_NULL_",
                  value: (
                    "table" == prop.restriction_type && "identifier" == prop.subject ?
                    "UID" :
                    (prop.mandatory ? "(empty)" : "(all)")
                  ),
                });
              }
              return enum_list;
            }
          };
        } else if ("identifier_list" == prop.restriction_type) {
          params.type = "text";
        } else {
          params.type = prop.restriction_type;
        }

        action.add_property("restrictions", `restrict_${prop.name}`, params);
      });
    }
  }
}

export class CN_report_add extends CN_action_add {
  current_report_type_id; // used in the custom create_restriction_inputs function (above)

  /**
   * Extends parent method
   */
  async run(children = false) {
    await create_restriction_inputs(this); // use private function above to load restrictions
    await super.run(children);
  }

  /**
   * Extends parent method
   */
  async on_post_submit(response) {
    await CN_session.navigate_to(this.get_model().get_view_url(response));
  }
}

export class CN_report_view extends CN_action_report_view {
  current_report_type_id; // used in the custom create_restriction_inputs function (above)

  /**
   * Extends parent method
   */
  async run(children = false) {
    await create_restriction_inputs(this); // use private function above to load restrictions
    await super.run(children);
  }
}
