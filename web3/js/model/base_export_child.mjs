import { CN_action_list } from "../action/list.mjs"
import { CN_api } from "../api.mjs"
import { CN_base_model } from "./base_model.mjs"
import { CN_common } from "../common.mjs"
import { CN_session } from "../session.mjs"

export class CN_model_base_export_child extends CN_base_model {
  constructor(type) {
    super({
      wording: {
        singular: `export ${type}`,
        plural: `export ${type}s`,
        posessive: `export ${type}'s`,
      },
      columns: {
        rank: { title: "Rank", type: "rank" },
        table_name: { title: "Table", table_prefix: false },
        subtype: { title: "Sub-Type" },
        column_name: { title: "Column", table_prefix: false },
      },
      properties: {
        rank: { title: "Rank", type: "rank" },
        table_name: {
          title: "Table",
          type: "enum",
          enum: {
            get_enums: () => {
              const export_table_names = Object.keys(this.get_parent_model().get_export_tables());
              return export_table_names.map(name => ({ key: name, value: name }));
            }
          },
          on_change: async (form_input, valid) => {
            const action = this.get_action();

            // run the default behaviour
            await action.on_property_change("table_name", valid);

            // re-run the action so the changed property is applied in the view and all child lists
            if (valid) action.run(true);
          }
        },
        subtype: {
          title: "Sub-Type",
          type: "enum",
          enum: {
            get_enums: async () => {
              let enums = [];
              const table_name = this.get_action().get_property_value("table_name");
              if ("site" == table_name) {
                enums = [
                  { key: "default", value: "Default" },
                  { key: "effective", value: "Effective" },
                  { key: "preferred", value: "Preferred" },
                ];
              } else if ("address" == table_name) {
                enums = [
                  { key: "first", value: "First" },
                  { key: "primary", value: "Primary" },
                ];
              } else {
                const table = this.get_parent_model().get_export_tables()[name];
                if (null != table) {
                  const response = await CN_api.get(table, {
                    select: { column: ["id", "name"] },
                    modifier: { order: "name", limit: 1000000 },
                  });

                  enums = response.map(record => ({ key: record.id, value: record.name }));
                }
              }

              return enums;
            },
          },
          is_hidden: () => {
            return !this.get_parent_model().get_export_tables().hasOwnProperty(
              this.get_action().get_property_value("table_name")
            );
          },
        },
        column_name: {
          title: "Column",
          type: "enum",
          enum: {
            get_enums: () => {
              const table = this.get_action().get_property_value("table_name");
              if (!table) return [];
              if ("auxiliary" == table) return [{ key: "is_in_collection", value: "Is In Collection" }];

              const module = CN_session.get_module(table);
              return module.get_property_names().sort().map(name => ({ key: name, value: name }));
            },
          },
        },
      },
    });
  }
}
