import { CN_base_model } from "../base_model.mjs"

export class CN_report_type_model extends CN_base_model {
  constructor() {
    super({
      wording: {
        singular: "report type",
        plural: "report types",
        posessive: "report type's",
      },
      columns: {
        title: { title: "Title" },
        subject: { title: "Subject" },
        description: { title: "Description", align: "left" },
      },
      properties: {
        title: { title: "Title", format: "identifier" },
        subject: { title: "Subject" },
        description: { title: "Description", type: "text" },
      },
    });
  }
}
