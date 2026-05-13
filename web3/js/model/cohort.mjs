import { CN_model_base } from "./base_model.mjs"
import { CN_session } from "../session.mjs"

export class CN_model_cohort extends CN_model_base {
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
