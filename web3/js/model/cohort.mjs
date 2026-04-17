import { CN_base_model } from "./base_model.mjs"
import { CN_session } from "../session.mjs"

export class CN_cohort_model extends CN_base_model {
  constructor() {
    super({
      wording: {
        singular: "cohort",
        plural: "cohorts",
        posessive: "cohort's",
      },
      columns: {
        name: { title: "Name" },
        participant_count: { title: "Participants", type: "number", table_prefix: false },
      },
    });
  }
}
