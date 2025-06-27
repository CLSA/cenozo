import CN_timezones from "./timezones.mjs"

import { CN_base_model } from "../base_model.mjs"

export class CN_user_model extends CN_base_model {
  constructor() {
    super({
      wording: {
        singular: "user",
        plural: "users",
        posessive: "user's",
      },
      columns: {
        active: { title: "Active", type: "boolean" },
        name: { title: "Name" },
        first_name: { title: "First Name", },
        last_name: { title: "Last Name", },
        email: { title: "Email", },
      },
      properties: {
        active: { title: "Active", type: "boolean", },
        name: {
          title: "Name",
          is_constant: (model) => "view" == model.type,
        },
        first_name: { title: "First Name", },
        last_name: { title: "Last Name", },
        email: { title: "Email", },
        timezone: {
          title: "Timezone",
          type: "typeahead",
          typeahead: { list: CN_timezones }
        },
        use_12hour_clock: { title: "Use 12-hour Clock", type: "boolean" },
        login_failures: {
          title: "Login Failures",
          is_hidden: (model) => "add" == model.type,
        },
      },
    });
  }
}
