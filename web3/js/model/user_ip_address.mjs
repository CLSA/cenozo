import { CN_base_model } from "./base_model.mjs"

export class CN_model_user_ip_address extends CN_base_model {
  constructor() {
    super({
      wording: {
        singular: "login address",
        plural: "login addresses",
        posessive: "login address'",
      },
      columns: {
        user: { column: "user.name", title: "User" },
        ip_address: { title: "IP Address" },
        datetime: { title: "Date & Time", type: "datetime" },
      },
    });
  }
}
