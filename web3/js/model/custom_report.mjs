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
          /*
          TODO: need to implement base64-based columns
          mimeType: "text/sql",
          getFilename: function ($state, model) {
            return model.viewModel.record.name + ".sql";
          }
          */
        },  
        description: { title: "Description", type: "text" },  
      },
    });
  }
}
