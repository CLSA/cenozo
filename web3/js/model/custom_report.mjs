import { CN_base_model } from "../base_model.mjs"

export class CN_custom_report_model extends CN_base_model {
  constructor() {
    super({
      wording: {
        singular: "custom report",
        plural: "custom reports",
        posessive: "custom report's",
      },
      columns: {
        name: { title: "Name" },
        description: { title: "Description", type: "text", align: "left" },
      },
      properties: {
        name: { title: "Name", format: "identifier" },
        data: {
          title: "SQL Report",
          type: "base64",
          mime_type: "application/sql",
          get_filename: async (action) => action.get_property("name").state.get() + ".sql",
        },
        description: { title: "Description", type: "text" },
      },
    });
  }
}
