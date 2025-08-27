import CN_api from "../api.mjs"
import CN_session from "../session.mjs"

import { CN_base_add } from "../base_add.mjs"
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
          is_hidden: () => "trace.list" != CN_session.get_leaf_action_name(),
        },
        trace_type: { column: "trace_type.name", title: "Type" },
        datetime: { title: "Date & Time", type: "datetime" },
        user: { column: "user.name", title: "User" },
        note: { title: "Note", type: "text" },

        // used in the CN_trace_list.on_row_click method below
        participant_id: { is_hidden: () => true },
      },
      properties: {
        trace_type_id: {
          title: "Trace Type",
          type: "enum",
          enum: {
            path: "trace_type",
            select: { column: [
              "name",

            ] },
          },
        },
        note: { title: "Note", type: "text" },
      },
    });
  }
}

export class CN_trace_add extends CN_base_add {
  async on_load() {
    await super.on_load();

    // only allow all-site roles to use the "unreachable" trace type
    const prop = this.get_property("trace_type_id");
    let trace_type = prop.enum.values.find(e => "unreachable" == e.name);
    if (trace_type) trace_type.disabled = true;

    // get the participant's current trace type
    const trace_list = await CN_api.get(this.get_model().get_base_path("api"), {
      select: { column: "trace_type_id" },
      modifier: { order: { "trace.datetime": true } } },
    );

    // disable that trace type from the available enum list to prevent duplicates
    if (0 < trace_list.length) {
      trace_type = prop.enum.values.find(e => e.id == trace_list[0].trace_type_id);
      if (trace_type) trace_type.disabled = true;
    }
  }
}

export class CN_trace_list extends CN_base_list {
  /**
   * Extends the parent method
   */
  get_on_load_parameters() {
    let params = super.get_on_load_parameters();
    if ("trace.list" == CN_session.get_leaf_action_name()) {
      params.modifier.where = [{
        // restrict based on role's all_sites parameter
        column: "trace_type.name",
        operator: CN_session.data.role.all_sites ? "!=" : "=",
        value: CN_session.data.role.all_sites ? null : "site",
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
    if ("trace.list" == CN_session.get_leaf_action_name()) {
      await CN_session.navigate_to(`participant/view/${record.participant_id}`);
    }
  }
}
