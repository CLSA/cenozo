import { CN_api } from "../api.mjs"
import { CN_base_model } from "./base_model.mjs"
import { CN_model_user } from "./user.mjs"
import { CN_session } from "../session.mjs"

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
          is_hidden: () => "user" == CN_session.get_leaf_model().get_parent_model().get_name(),
        },
        role_id: {
          title: "Role",
          type: "enum",
          enum: {
            get_enums: async () => {
              return (await CN_api.get("role", {
                select: { column: "name" },
                modifier: { order: "name" },
                granting: true, // only return roles which we can grant access to
              })).map(record => ({
                key: record.id,
                value: record.name,
                disabled: false,
              }));
            },
          },
        },
        site_id: {
          title: "Site",
          type: "enum",
          enum: {
            get_enums: async () => {
              return (await CN_api.get("site", {
                select: { column: "name" },
                modifier: { order: "name" },
                granting: true, // only return sites which we can grant access to
              })).map(record => ({
                key: record.id,
                value: record.name,
                disabled: false,
              }));
            },
          },
          is_hidden: () => "site" == CN_session.get_leaf_model().get_parent_model().get_name(),
        },
      },
    });
  }
}
