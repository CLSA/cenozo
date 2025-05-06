import { PN_base_model } from "../base_model.js"

export class PN_access_model extends PN_base_model {
  constructor(module) {
    super(
      module,
      {
        name: {
          singular: "access",
          plural: "accesses",
          posessive: "access'",
        },
        columns: {
          user: { column: "user.name", title: "User", },
          site: { column: "site.name", title: "Site", },
          role: { column: "role.name", title: "Role", },
        },
        properties: {
          user_id: {
            title: "User",
            type: "enum",
            enum: { path: "user" },
          },
          site_id: {
            title: "Site",
            type: "enum",
            enum: { path: "site" },
          },
          role_id: {
            title: "Role",
            type: "enum",
            enum: { path: "role" },
          },
        },
      }
    );
  }
}
