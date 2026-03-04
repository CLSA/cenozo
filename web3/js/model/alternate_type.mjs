import { CN_session } from "../session.mjs"

import { CN_base_model } from "./base_model.mjs"
import { CN_action_list } from "../element/action/list.mjs"

export class CN_alternate_type_model extends CN_base_model {
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

        // used in the CN_alternate_type_list.is_choose_disabled method below
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

export class CN_alternate_type_list extends CN_action_list {
  /**
   * Extends the parent method
   */
  is_choose_disabled(record) {
    // when selecting an alternate's alternate_type, restrict by role
    return (
      "alternate.view" == CN_session.get_leaf_action_name() &&
      0 < record.role_count &&
      !record.access
    );
  }
}
