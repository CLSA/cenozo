import { CN_base_model } from "./base_model.mjs"

export class CN_model_availability_type extends CN_base_model {
  constructor() {
    super({
      wording: {
        singular: "availability type",
        plural: "availability types",
        posessive: "availability type's",
      },
      columns: {
        name: { title: "Name", },
        participant_count: { title: "Participants", type: "integer", table_prefix: false },
      },
      properties: {
        name: { title: "Name" },
      },
    });
  }
}
