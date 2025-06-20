import { CN_base_model } from "../base_model.mjs"

export class CN_consent_type_model extends CN_base_model {
  constructor(module) {
    super(
      module,
      {
        name: {
          singular: "consent type",
          plural: "consent types",
          posessive: "consent type's",
        },
        columns: {
          name: { title: "Name" },
          accept_count: { title: "Accepts", type: "number", table_prefix: false },
          deny_count: { title: "Denies", type: "number", table_prefix: false },
          role_list: { title: "Roles", table_prefix: false },
          description: { title: "Description", type: "text", align: "left" },
        },
        properties: {
          name: { title: "Name" },
          description: { title: "Description", type: "text" },
        },
      }
    );
  }
}
