import { CN_base_model } from "./base_model.mjs"

export class CN_model_failed_login extends CN_base_model {
  constructor() {
    super({
      wording: {
        singular: "failed login",
        plural: "failed logins",
        posessive: "failed login's",
      },
      columns: {
        user: { column: "user.name", title: "User" },
        application: { column: "application.title", title: "Application" },
        address: { title: "Address" },
        datetime: { title: "Date & Time", type: "datetimesecond" },
      },
    });
  }
}
