import { CN_base_model } from "../base_model.mjs"
import { CN_base_view } from "../base_view.mjs"
import { CN_export_model } from "./export.mjs"

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
        ...CN_export_model.get_export_columns(),
        logic: { title: "Logic" },
        test: { title: "Test" },
        value: { title: "Value" },
      },
      properties: {
        rank: { title: "Rank", type: "rank" },
        ...CN_export_model.get_export_properties(),
        logic: { title: "Logic", type: "enum" },
        test: { title: "Test", type: "enum" },
        value: { title: "Value" },
      },
    });
  }
}

export class CN_export_restriction_view extends CN_base_view {
  /**
   * Extend parent method
   */
  async on_set_property(prop_name) {
    await super.on_set_property(prop_name);

    // if the table name has changed then make sure to update the column_name as well
    if ("table_name" == prop_name) {
      const prop = this.get_property("column_name");
      prop.state.set(prop.enum.values[0].key);
      await super.on_set_property("column_name");
    }
  }
}
