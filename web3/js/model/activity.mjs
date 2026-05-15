import { CN_base_model } from "./base_model.mjs"

export class CN_model_activity extends CN_base_model {
  constructor() {
    super({
      wording: {
        singular: "activity",
        plural: "activities",
        posessive: "activity's",
      },
      columns: {
        user: { column: "user.name", title: "User", },
        site: { column: "site.name", title: "Site", },
        role: { column: "role.name", title: "Role", },
        start_datetime: { title: "Start", type: "datetimesecond" },
        end_datetime: { title: "End", type: "datetimesecond" },
      },
      get_default_order: () => ({ column: "start_datetime", desc: true }),
    });
  }
}
