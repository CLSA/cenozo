import { CN_base_model } from "../base_model.js"

export class CN_alternate_type_model extends CN_base_model {
  constructor(module) {
    super(
      module,
      {
        name: {
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
          description: { title: "Description", type: "text", align: "left" },

          // used by the alternate module to determine whether a type can be chosen
          access: { table_prefix: false, is_hidden: (model) => true },
          role_count: { table_prefix: false, is_hidden: (model) => true },
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
      }
    );
  }
}
