import { CN_base_model } from "../base_model.mjs"

export class CN_export_restriction_model extends CN_base_model {
  constructor() {
    super({
      wording: {
        singular: "export restriction",
        plural: "export restrictions",
        posessive: "export restriction's",
      },
      columns: {
        export: { column: "export.title", title: "Export Type" },
        rank: { title: "Rank", type: "rank" },
        table_name: { title: "Table" },
        formatted_subtype: { title: "Sub-Type", table_prefix: false },
        column_name: { title: "Column" },
        logic: { title: "Logic" },
        test: { title: "Test" },
        value: { title: "Value" },
      },
      properties: {
        rank: { title: "Rank", type: "rank" },
        table_name: { title: "Table" },
        subtype: { title: "Sub-Type" },
        column_name: { title: "Column" },
        logic: { title: "Logic", type: "enum" },
        test: { title: "Test", type: "enum" },
        value: { title: "Value" },
      },
    });
  }
}
