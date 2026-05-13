import { CN_model_base } from "./base_model.mjs"

export class CN_model_trace_type extends CN_model_base {
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
        description: { title: "Description", type: "text" },
      },
      properties: {
        name: { title: "Name", format: "identifier" },
        description: { title: "Description", type: "text" },
      },
    });
  }
}
