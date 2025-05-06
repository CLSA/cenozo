import { PN_base_model } from "../base_model.js"

export class PN_activity_model extends PN_base_model {
  constructor(module) {
    super(
      module,
      {
        name: {
          singular: "activity",
          plural: "activities",
          posessive: "activity's",
        },
        columns: {
          user: { column: "user.name", title: "User", },
          site: { column: "site.name", title: "Site", },
          role: { column: "role.name", title: "Role", },
          start_datetime: { title: "Start", type: "datetime" },
          end_datetime: { title: "End", type: "datetime" },
        },
      }
    );
  }
}
