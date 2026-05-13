import { CN_model_base } from "./base_model.mjs"

export class CN_model_availability_type extends CN_model_base {
  constructor() {
    super({
      wording: {
        singular: "availability type",
        plural: "availability types",
        posessive: "availability type's",
      },
      columns: {
        name: { title: "Name", },
        participant_count: { title: "Participants", type: "number", table_prefix: false },
      },
      properties: {
        name: { title: "Name" },
      },
    });
  }
}
