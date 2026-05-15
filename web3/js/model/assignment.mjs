import { CN_base_model } from "./base_model.mjs"
import { CN_session } from "../session.mjs"

export class CN_model_assignment extends CN_base_model {
  constructor() {
    super({
      wording: {
        singular: "assignment",
        plural: "assignments",
        posessive: "assignment's",
      },
      columns: {
        uid: {
          column: "participant.uid",
          title: "UID",
          is_hidden: () => "assignment" != CN_session.get_leaf_model().get_name(),
        },
        qnaire_name: {
          title: "Questionnaire",
          is_hidden: () => "assignment" != CN_session.get_leaf_model().get_name(),
          table_prefix: false,
        },
        user: { column: "user.name", title: "User" },
        role: { column: "role.name", title: "Role" },
        site: { column: "site.name", title: "Site" },
        phone_call_count: { title: "Calls", type: "number", table_prefix: false },
        status: { title: "Status", table_prefix: false },
        start_datetime: { title: "Start", type: "datetimesecond" },
        end_datetime: { title: "End", type: "datetimesecond" },
      },
      properties: {
        participant: {
          meta: { table: "participant", column: "uid" },
          title: "Participant",
          is_constant: () => true,
        },
        user: { meta: { table: "user", column: "name" }, title: "User", is_constant: () => true },
        role: { meta: { table: "role", column: "name" }, title: "Role", is_constant: () => true },
        site: { meta: { table: "site", column: "name" }, title: "Site", is_constant: () => true },
        start_datetime: {
          title: "Start Date & Time",
          type: "datetimesecond",
          max: "end_datetime",
        },
        end_datetime: {
          title: "End Date & Time",
          type: "datetimesecond",
          min: "start_datetime",
          max: "now",
        },
      },
    });
  }
}
