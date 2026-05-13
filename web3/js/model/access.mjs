import { CN_model_base } from "./base_model.mjs"

export class CN_model_access extends CN_model_base {
  constructor() {
    super({
      wording: {
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
    });
  }
}
