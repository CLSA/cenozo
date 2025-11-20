import CN_session from "../session.mjs"

import { CN_base_model } from "../base_model.mjs"

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

  /**
   * Extends the parent method
   */
  get_base_path(type) {
    // restrict the application cohort list by application-type
    return (
      "application" == this.get_parent_model().get_name() ?
      `application_type/${CN_session.data.application.application_type_id}/cohort` :
      super.get_base_path(type)
    );
  }
}
