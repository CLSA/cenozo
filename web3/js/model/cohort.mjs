import { CN_base_model } from "./base_model.mjs"
import { CN_session } from "../session.mjs"

export class CN_model_cohort extends CN_base_model {
  constructor() {
    super({
      wording: {
        singular: "cohort",
        plural: "cohorts",
        posessive: "cohort's",
      },
      columns: {
        name: { title: "Name" },
        participant_count: { title: "Participants", type: "integer", table_prefix: false },
      },
    });
  }
}
