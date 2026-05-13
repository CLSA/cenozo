import { CN_model_base } from "./base_model.mjs"

export class CN_model_log_entry extends CN_model_base {
  constructor() {
    super({
      wording: {
        singular: "log entry",
        plural: "log entries",
        posessive: "log entry's",
      },
      columns: {
        datetime: { title: "Date & Time", type: "datetimesecond" },
        type: { title: "Type" },
        user: { title: "User", },
        site: { title: "Site", },
        role: { title: "Role", },
        description: { title: "Description", type: "html", limit: 500 },
      },
      properties: {
        datetime: { title: "Date & Time", type: "datetimesecond" },
        type: { title: "Type" },
        user: { title: "User" },
        site: { title: "Site" },
        role: { title: "Role" },
        service: { title: "Service" },
        description: { title: "Description", type: "text" },
        stack_trace: { title: "Stack Trace", type: "text" },
      },
    });
  }
}
