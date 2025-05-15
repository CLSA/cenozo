import { CN_base_add } from "../base_add.js"
import { CN_base_model } from "../base_model.js"
import { CN_base_view } from "../base_view.js"

export class CN_user_model extends CN_base_model {
  constructor(module) {
    super(
      module,
      {
        name: {
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
            is_constant: (model) => model instanceof CN_base_view,
          },
          first_name: { title: "First Name", },
          last_name: { title: "Last Name", },
          email: { title: "Email", },
          timezone: {
            title: "Timezone",
            type: "typeahead",
            typeahead: {
              min_length: 2,
              list: moment.tz.names(),
            }
          },
          use_12hour_clock: { title: "Use 12-hour Clock", type: "boolean" },
          login_failures: {
            title: "Login Failures",
            is_hidden: (model) => model instanceof CN_base_add,
          },
        },
      }
    );
  }
}
