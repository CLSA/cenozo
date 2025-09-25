import { CN_base_model } from "../base_model.mjs"

export class CN_export_column_model extends CN_base_model {
  constructor() {
    super({
      wording: {
        singular: "export column",
        plural: "export columns",
        posessive: "export column's",
      },
      columns: {
        export: { column: "export.title", title: "Export Type" },
        rank: { title: "Rank", type: "rank" },
        table_name: { title: "Table" },
        formatted_subtype: { title: "Sub-Type", table_prefix: false },
        column_name: { title: "Column" },
        include: { title: "Visible", type: "boolean" },
      },
      properties: {
        rank: { title: "Rank", type: "rank" },
        table_name: { title: "Table" },
        subtype: { title: "Sub-Type" },
        column_name: { title: "Column" },
        include: { title: "Visible", type: "boolean" },
      },
    });
  }
}
