import { CN_action_view } from "../action/view.mjs"
import { CN_base_model } from "./base_model.mjs"
import { CN_model_export } from "./export.mjs"

export class CN_model_export_restriction extends CN_base_model {
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
        logic: { title: "Logic" },
        ...CN_model_export.get_export_columns(),
        test: { title: "Test" },
        value: { title: "Value" },
      },
      properties: {
        rank: {
          title: "Rank",
          type: "rank",
          on_change: async (form_input, valid) => {
            const action = form_input.get_action();

            // run the default behaviour
            await action.on_property_change("rank", valid);

            // re-run the action so the changed property is applied in the view and all child lists
            if (valid) action.run(true);
          },
        },
        logic: {
          title: "Logic",
          type: "enum",
          // don't show logic if this is the first restriction
          is_hidden: () => {
            const rank = this.get_action().get_property_value("rank");
            return !rank || 1 == rank;
          },
        },
        ...CN_model_export.get_export_properties(),
        test: { title: "Test", type: "enum" },
        value: { title: "Value" },
      },
    });
  }
}

export class CN_view_export_restriction extends CN_action_view {
  /**
   * Extend parent method
   */
  async on_set_property(prop_name, run = true) {
    await super.on_set_property(prop_name, false);

    // if the table name has changed then make sure to update the column_name as well
    if ("table_name" == prop_name) {
      await this.set_property_value(
        "column_name",
        this.get_property(prop_name).form_input.get_config("enum").values[0].key
      );
      await super.on_set_property("column_name", false);
    }

    if (run) await this.run();
  }
}
