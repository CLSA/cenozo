import { CN_model_base } from "./base_model.mjs"

export class CN_model_hold_type extends CN_model_base {
  constructor() {
    super({
      wording: {
        singular: "hold type",
        plural: "hold types",
        posessive: "hold type's",
      },
      columns: {
        type: { title: "Type" },
        name: { title: "Name" },
        participant_count: { title: "Participants", type: "number", table_prefix: false },
        role_list: { title: "Roles", table_prefix: false },
        description: { title: "Description", type: "text" },
      },
      properties: {
        type: { title: "Type", type: "enum" },
        name: { title: "Name", format: "identifier" },
        description: { title: "Description", type: "text" },
      },
    });
  }
}
