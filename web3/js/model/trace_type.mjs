import { CN_base_model } from "../base_model.mjs"

export class CN_trace_type_model extends CN_base_model {
  constructor() {
    super({
      wording: {
        singular: "trace type",
        plural: "trace types",
        posessive: "trace type's",
      },
      columns: {
        name: { title: "Name" },
        participant_count: { title: "Participants", type: "number", table_prefix: false },
        role_list: { title: "Roles", table_prefix: false },
        description: { title: "Description", type: "text" },
      },
      properties: {
        name: { title: "Name", format: "identifier" },
        description: { title: "Description", type: "text" },
      },
    });
  }
}
