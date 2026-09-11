import { CN_api } from "../api.mjs"
import { CN_base_action } from "../action/base_action.mjs"
import { CN_common } from "../common.mjs"
import { CN_model_base_export_child } from "./base_export_child.mjs"
import { CN_session } from "../session.mjs"

export class CN_model_export_restriction extends CN_model_base_export_child {
  constructor() {
    super("restriction");
  }

  /**
   * Extend parent method
   */
  async clone_columns() {
    const columns = await super.clone_columns();
    return {
      rank: columns.rank,
      logic: { title: "Logic" },
      table_name: columns.table_name,
      subtype: columns.subtype,
      column_name: columns.column_name,
      test: { title: "Test" },
      value: { title: "Value" },
    };
  }

  /**
   * Extend parent method
   */
  async clone_properties() {
    const properties = await super.clone_properties();
    return {
      rank: properties.rank,
      logic: {
        title: "Logic",
        type: "enum",
        // don't show logic if this is the first restriction
        is_hidden: () => {
          const rank = this.get_action().get_property_value("rank");
          return !rank || 1 == rank;
        },
      },
      table_name: properties.table_name,
      subtype: properties.subtype,
      column_name: properties.column_name,
      test: { title: "Test", type: "enum" },
      value: { title: "Value" },
    };
  }
}

export class CN_list_export_restriction extends CN_base_action {
  constructor(parent_el, model) {
    super("list", parent_el, model);
  }

  /**
   * Returns the formatted record count
   * @return string
   */
  get_formatted_record_count() {
    // TODO: implement
    return "[0]";
  }

  /**
   * Extend parent method
   */
  async get_text(type) {
    return "Not Yet Implemented";
  }
}
