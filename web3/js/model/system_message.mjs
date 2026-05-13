import { CN_model_base } from "./base_model.mjs"
import { CN_session } from "../session.mjs"

export class CN_model_system_message extends CN_model_base {
  constructor() {
    super({
      wording: {
        singular: "system message",
        plural: "system messages",
        posessive: "system message's",
      },
      columns: {
        title: { title: "Title" },
        application: { column: "application.title", title: "Application" },
        site: { column: "site.name", title: "Site" },
        role: { column: "role.name", title: "Role" },
        expiry: { title: "Expiry", type: "date" },
      },
      properties: {
        application_id: {
          title: "Application",
          type: "enum",
          enum: {
            path: "application",
            select: { column: {
              table: "application",
              column: "title",
              alias: "name",
            } },
            modifier: {
              where: { column: "application.id", operator: "=", value: CN_session.get("application", "id") },
              order: "title",
            },
          },
          is_hidden: (model) => CN_session.get("role", "all_sites") ? false : "add" == model.get_action_name(),
          is_constant: (model) => CN_session.get("role", "all_sites") ? false : "view" == model.get_action_name(),
        },
        site_id: {
          title: "Site",
          type: "enum",
          enum: { path: "site" },
          is_hidden: (model) => CN_session.get("role", "all_sites") ? false : "add" == model.get_action_name(),
          is_constant: (model) => CN_session.get("role", "all_sites") ? false : "view" == model.get_action_name(),
        },
        role_id: {
          title: "Role",
          type: "enum",
          enum: { path: "role" },
        },
        title: { title: "Title" },
        expiry: { title: "Expiry", type: "date" },
        note: { title: "Note", type: "text" },
      },
    });
  }
}
