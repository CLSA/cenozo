import { PN_base_model } from "../base_model.js"

export class PN_failed_login_model extends PN_base_model {
  constructor(module) {
    super(
      module,
      {
        name: {
          singular: "failed login",
          plural: "failed logins",
          posessive: "failed login's",
        },
        columns: {
          user: { column: "user.name", title: "User", },
          address: { title: "Address", },
          datetime: { title: "Date & Time", type: "datetime" },
        },
      }
    );
  }
}
