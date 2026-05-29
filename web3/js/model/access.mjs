import { CN_base_model } from "./base_model.mjs"
import { CN_model_user } from "./user.mjs"

export class CN_model_access extends CN_base_model {
  constructor() {
    super({
      wording: {
        singular: "access",
        plural: "accesses",
        posessive: "access'",
      },
      columns: {
        user: { column: "user.name", title: "User" },
        first_name: { column: "user.first_name", title: "First Name" },
        last_name: { column: "user.last_name", title: "Last Name" },
        role: { column: "role.name", title: "Role", },
        site: { column: "site.name", title: "Site", },
        datetime: { title: "Last Used", type: "datetimesecond" },
      },
      properties: {
        user_id: {
          title: "User",
          type: "typeahead",
          typeahead: CN_model_user.get_typeahead({
            modifier: { where: { column: "user.active", operator: "=", value: true } },
          }),
        },
        role_id: {
          title: "Role",
          type: "enum",
          enum: {
            path: "role",
            // add granting=true
          },
        },
        site_id: {
          title: "Site",
          type: "enum",
          enum: {
            path: "site",
            // add granting=true
          },
        },
      },
    });
  }
}
