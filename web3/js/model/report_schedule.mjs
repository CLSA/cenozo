import { CN_base_model } from "./base_model.mjs"

export class CN_model_report_schedule extends CN_base_model {
  constructor() {
    super({
      wording: {
        singular: "report schedule",
        plural: "report schedules",
        posessive: "report schedule's",
      },
      columns: {
        report_type: { column: "report_type.name", title: "Report Type" },
        user: { column: "user.name", title: "User" },
        site: { column: "site.name", title: "Site" },
        role: { column: "role.name", title: "Role" },
        schedule: { title: "Schedule" },
      },
      properties: {
        user: {
          meta: { table: "user", column: "name" },
          title: "User",
          is_hidden: (model) => "add" == model.get_action_name(),
          is_constant: () => true,
        },
        site_id: {
          title: "Site",
          type: "enum",
          enum: { path: "site" },
          help: "Which site to run the report under.",
        },
        role_id: {
          title: "Role",
          type: "enum",
          enum: { path: "role" },
          help: "Which role to run the report under.",
        },
        schedule: {
          title: "Schedule",
          type: "enum",
          help: "How often to run the report.",
        },
        format: {
          title: "Format",
          type: "enum",
          is_constant: (model) => "view" == model.get_action_name(),
        },
      },
    });
  }
}
