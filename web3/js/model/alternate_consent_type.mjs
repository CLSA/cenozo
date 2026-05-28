import { CN_base_model } from "./base_model.mjs"

export class CN_model_alternate_consent_type extends CN_base_model {
  constructor() {
    super({
      wording: {
        singular: "alternate consent type",
        plural: "alternate consent types",
        posessive: "alternate consent type's",
      },
      columns: {
        name: { title: "Name" },
        accept_count: { title: "Accepts", type: "integer", table_prefix: false },
        deny_count: { title: "Denies", type: "integer", table_prefix: false },
        role_list: { title: "Roles", table_prefix: false },
        description: { title: "Description", type: "text" },
      },
      properties: {
        name: { title: "Name" },
        description: { title: "Description", type: "text" },
      },
    });
  }
}
