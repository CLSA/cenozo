import { CN_model_base } from "./base_model.mjs"

export class CN_model_event_type_mail extends CN_model_base {
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
