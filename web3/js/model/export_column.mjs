import { CN_api } from "../api.mjs"
import { CN_base_action } from "../action/base_action.mjs"
import { CN_common } from "../common.mjs"
import { CN_model_base_export_child } from "./base_export_child.mjs"
import { CN_session } from "../session.mjs"

export class CN_model_export_column extends CN_model_base_export_child {
  constructor() {
    super("column");
  }

  /**
   * Extend parent method
   */
  async clone_columns() {
    const columns = await super.clone_columns();
    columns.include = { title: "Visible", type: "boolean" };
    return columns;
  }

  /**
   * Extend parent method
   */
  async clone_properties() {
    const properties = await super.clone_properties();
    properties.include = { title: "Visible", type: "boolean" };
    return properties;
  }
}

export class CN_list_export_column extends CN_base_action {
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
