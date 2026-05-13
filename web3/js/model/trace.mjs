import { CN_action_list } from "../action/list.mjs"
import { CN_api } from "../api.mjs"
import { CN_model_base } from "./base_model.mjs"
import { CN_session } from "../session.mjs"

export class CN_model_trace extends CN_model_base {
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
          is_hidden: (model) => null != model.get_parent_model(),
        },
        trace_type: { column: "trace_type.name", title: "Type" },
        datetime: { title: "Date & Time", type: "datetime" },
        user: { column: "user.name", title: "User" },
        note: { title: "Note", type: "text" },

        // used in the CN_list_trace.on_row_click method below
        participant_id: { is_hidden: () => true },
      },
      properties: {
        trace_type_id: {
          title: "Trace Type",
          type: "enum",
          enum: {
            get_enums: async () => {
              const response = await CN_api.get("trace_type");
              return response.map(tt => ({
                key: tt.id,
                value: tt.name,
                // only allow all-site roles to use the "unreachable" trace type
                disabled: !CN_session.get("role", "all_sites") && "unreachable" == tt.name,
              }));
            },
          },
        },
        note: { title: "Note", type: "text" },
      },
    });
  }
}

export class CN_list_trace extends CN_action_list {
  /**
   * Extends the parent method
   */
  get_on_load_parameters() {
    let params = super.get_on_load_parameters();
    if (null == this.get_model().get_parent_model()) {
      params.modifier.where = [{
        // restrict based on role's all_sites parameter
        column: "trace_type.name",
        operator: CN_session.get("role", "all_sites") ? "!=" : "=",
        value: CN_session.get("role", "all_sites") ? null : "site",
      }, {
        // do not include excluded participants
        column: "participant.exclusion_id",
        operator: "=",
        value: null,
      }, {
        // do not include participants in a final hold
        column: 'IFNULL(hold_type.type, "")',
        operator: "!=",
        value: "final",
      }];

      // NOTE: We must add a hold_type column for the last where statement to work.
      // This is because selecting the hold_type table will make the service join to the last hold
      params.select.column.push({ table: "hold_type", column: "type" });
    }

    return params;
  }

  /**
   * Extends the parent method
   */
  async on_row_click(record) {
    if (null == this.get_model().get_parent_model()) {
      await CN_session.navigate_to(`participant/view/${record.participant_id}`);
    }
  }
}
