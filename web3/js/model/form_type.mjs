import { CN_action_view } from "../action/view.mjs"
import { CN_base_model } from "./base_model.mjs"

export class CN_model_form_type extends CN_base_model {
  constructor() {
    super({
      wording: {
        singular: "form type",
        plural: "form types",
        posessive: "form type's",
      },
      columns: {
        title: { title: "Title" },
        form_count: { title: "Forms", type: "integer", table_prefix: false },
        description: { title: "Description", type: "text" },
      },
      properties: {
        name: { title: "Name" },
        title: { title: "Title" },
        description: { title: "Description", type: "text" },
      },
    });
  }
}

export class CN_view_form_type extends CN_action_view {
  /**
   * Extends the parent method
   */
  async get_text(type) {
    if ("crumb" == type) {
      return this.get_property_value("title");
    }

    return await super.get_text(type);
  }
}
