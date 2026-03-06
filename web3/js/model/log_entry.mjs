import { CN_base_model } from "./base_model.mjs"

export class CN_log_entry_model extends CN_base_model {
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
