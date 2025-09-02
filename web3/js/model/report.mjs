import { CN_base_model } from "../base_model.mjs"

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
          meta: true,
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
          format: "float",
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
          format: "float",
          is_hidden: (model) => "add" == model.get_action_name(),
          is_constant: () => true,
        },
        parameters: {
          title: "Report Parameters",
          open: true,
          properties: {
            // TODO: implement report parameters as properties
          },
        },
      },
    });
  }
}
