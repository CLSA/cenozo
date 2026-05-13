import { CN_model_base } from "./base_model.mjs"

export class CN_model_failed_login extends CN_model_base {
  constructor() {
    super({
      wording: {
        singular: "failed login",
        plural: "failed logins",
        posessive: "failed login's",
      },
      columns: {
        user: { column: "user.name", title: "User", },
        address: { title: "Address", },
        datetime: { title: "Date & Time", type: "datetime" },
      },
    });
  }
}
