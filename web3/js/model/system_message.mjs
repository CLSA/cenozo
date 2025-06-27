import CN_session from "../session.mjs"

import { CN_base_model } from "../base_model.mjs"

export class CN_system_message_model extends CN_base_model {
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
              where: { column: "application.id", operator: "=", value: CN_session.data.application.id },
              order: "title",
            },
          },
          is_hidden: (model) => CN_session.data.role.all_sites ? false : "add" == model.get_type(),
          is_constant: (model) => CN_session.data.role.all_sites ? false : "view" == model.get_type(),
        },
        site_id: {
          title: "Site",
          type: "enum",
          enum: { path: "site" },
          is_hidden: (model) => CN_session.data.role.all_sites ? false : "add" == model.get_type(),
          is_constant: (model) => CN_session.data.role.all_sites ? false : "view" == model.get_type(),
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
