import CN_element from "../element.mjs"
import CN_session from "../session.mjs"

import { CN_base_list } from "../base_list.mjs"
import { CN_base_model } from "../base_model.mjs"

export class CN_trace_model extends CN_base_model {
  constructor() {
    super({
      wording: {
        singular: "trace",
        plural: "traces",
        posessive: "trace's",
      },
      columns: {
        uid: { column: "participant.uid", title: "UID" },
        cohort: {
          column: "cohort.name",
          title: "Cohort",
          is_hidden: (model) => "trace" != CN_session.get_leaf_module().get_name(),
        },
        trace_type: { column: "trace_type.name", title: "Name" },
        datetime: { title: "Date & Time", type: "datetime" },
        user: { column: "user.name", title: "User" },
        note: { title: "Note", type: "text" },

        // used in the CN_trace_list.on_row_click method below
        participant_id: { is_hidden: (model) => true },
      },
    });
  }
}

export class CN_trace_list extends CN_base_list {
  /**
   * Extends the parent method
   */
  async on_row_click(record) {
    if ("trace" == CN_session.get_leaf_module().get_name()) {
      await CN_session.navigate_to(`participant/view/${record.participant_id}`);
    }
  }
}
