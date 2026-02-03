import { CN_base_model } from "./base_model.mjs"

export class CN_source_model extends CN_base_model {
  constructor() {
    super({
      wording: {
        singular: "source",
        plural: "sources",
        posessive: "source's",
      },
      columns: {
        name: { title: "Name" },
        override_stratum: { title: "Override Stratum", type: "boolean" },
        participant_count: { title: "Participants", type: "number", table_prefix: false },
      },
      properties: {
        name: { title: "Name", format: "identifier" },
        override_stratum: { title: "Override Stratum Restrictions", type: "boolean" },
        description: { title: "Description", type: "text" },
      },
    });
  }
}
