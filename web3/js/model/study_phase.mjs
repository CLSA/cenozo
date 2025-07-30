import CN_session from "../session.mjs"

import { CN_base_model } from "../base_model.mjs"

export class CN_study_phase_model extends CN_base_model {
  constructor() {
    super({
      wording: {
        singular: "study phase",
        plural: "study phases",
        posessive: "study phase's",
      },
      columns: {
        study: { column: "study.name", title: "Study" },
        rank: { title: "Rank", type: "rank" },
        name: { title: "Name" },
        code: { title: "Code" },
        identifier: { column: "identifier.name", title: "Identifier" },
      },
      properties: {
        name: { title: "Name", format: "identifier" },
        code: { title: "Code", format: "identifier" },
        rank: { title: "Rank", type: "rank" },
        identifier_id: {
          title: "Special Identifier",
          type: "enum",
          enum: { path: "identifier" },
          is_hidden: () => 3 > CN_session.data.role.tier,
          help: "The special identifier used by this study-phase.",
        },
      },
    });
  }
}
