import { CN_model_base } from "./base_model.mjs"

export class CN_model_event_mail extends CN_model_base {
  constructor() {
    super({
      wording: {
        singular: "sent mail",
        plural: "sent mail",
        posessive: "sent mail's",
      },
      columns: {
        to_address: { title: "To" },
        cc_address: { title: "CC" },
        datetime: { title: "Date & Time", type: "datetimesecond", },
        subject: { title: "Subject" },
        sent: { title: "Sent", type: "boolean" },
      },
      properties: {
        to_address: { title: "To" },
        cc_address: { title: "CC" },
        datetime: { title: "Date & Time", type: "datetimesecond", },
        sent: { title: "Sent", type: "boolean" },
        subject: { title: "Subject" },
        body: { title: "Body", type: "text" },
      },
    });
  }
}
