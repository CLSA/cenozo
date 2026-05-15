import { CN_action_list } from "../action/list.mjs"
import { CN_base_model } from "./base_model.mjs"
import { CN_session } from "../session.mjs"

export class CN_model_alternate_type extends CN_base_model {
  constructor() {
    super({
      wording: {
        singular: "alternate type",
        plural: "alternate types",
        posessive: "alternate type's",
      },
      columns: {
        name: { title: "Name" },
        title: { title: "Title" },
        role_list: { title: "Roles", table_prefix: false },
        has_alternate_consent_type: { title: "Has Consent", type: "boolean" },
        alternate_count: { title: "Alternates", table_prefix: false },
        description: { title: "Description", type: "text" },

        // used in the CN_list_alternate_type.is_choose_disabled method below
        access: { table_prefix: false, is_hidden: () => true },
        role_count: { table_prefix: false, is_hidden: () => true },
      },
      properties: {
        name: {
          title: "Name",
          format: "alpha_num",
          help: "May only contain letters, numbers and underscores.",
        },
        title: { title: "Title", format: "identifier" },
        alternate_consent_type_id: {
          title: "Alternate Consent Type",
          type: "enum",
          enum: { path: "alternate_consent_type" },
        },
        description: { title: "Description", type: "text" },
      },
    });
  }
}

export class CN_list_alternate_type extends CN_action_list {
  /**
   * Extends the parent method
   */
  is_choose_disabled(record) {
    // when selecting an alternate's alternate_type, restrict by role
    const leaf_model = CN_session.get_leaf_model();
    return (
      "alternate" == leaf_model.get_name() &&
      "view" == leaf_model.get_action_name() &&
      0 < record.role_count &&
      !record.access
    );
  }
}
