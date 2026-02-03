import CN_api from "../api.mjs"
import CN_session from "../session.mjs"

import { CN_base_model } from "./base_model.mjs"
import { CN_action_view } from "../element/action/view.mjs"
import { CN_export_model } from "./export.mjs"

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
        ...CN_export_model.get_export_columns(),
        include: { title: "Visible", type: "boolean" },
      },
      properties: {
        rank: { title: "Rank", type: "rank" },
        ...CN_export_model.get_export_properties(),
        include: { title: "Visible", type: "boolean" },
      },
    });
  }
}

export class CN_export_column_view extends CN_action_view {
  /**
   * Extend parent method
   */
  async on_set_property(prop_name) {
    await super.on_set_property(prop_name);

    // if the table name has changed then make sure to update the column_name as well
    if ("table_name" == prop_name) {
      await super.on_set_property("column_name");
    }
  }
}
