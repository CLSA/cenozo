import { CN_base_model } from "./base_model.mjs"

export class CN_event_type_mail_model extends CN_base_model {
  constructor() {
    super({
      wording: {
        singular: "mail template",
        plural: "mail templates",
        posessive: "mail template's",
      },
      columns: {
        to_address: { title: "To" },
        cc_address: { title: "CC" },
        subject: { title: "Subject" },
      },
      properties: {
        to_address: { title: "To" },
        cc_address: { title: "CC" },
        subject: { title: "Subject" },
        body: { title: "Body", type: "text" },
      },
    });
  }
}
