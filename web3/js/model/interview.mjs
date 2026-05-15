import { CN_base_model } from "./base_model.mjs"
import { CN_session } from "../session.mjs"

export class CN_model_interview extends CN_base_model {
  constructor() {
    super({
      wording: {
        singular: "interview",
        plural: "interviews",
        posessive: "interview's",
      },
      columns: {
        uid: { column: "participant.uid", title: "UID" },
        site: { column: "site.name", title: "Credited Site" },
        start_datetime: { title: "Start", type: "datetimesecond" },
        end_datetime: { title: "End", type: "datetimesecond" },
      },
      properties: {
        participant: {
          meta: { table: "participant", column: "uid" },
          title: "Participant",
          is_constant: () => true,
        },  
        site_id: {
          title: "Credited Site",
          type: "enum",
          help: "This determines which site is credited with the completed interview.",
          is_constant: () => 3 > CN_session.get("role", "tier"),
        },
        start_datetime: {
          column: "interview.start_datetime",
          title: "Start Date & Time",
          type: "datetimesecond",
          max: "end_datetime",
          is_constant: () => 3 > CN_session.get("role", "tier"),
          help: "When the first call from the first assignment was made for this interview.",
        },
        end_datetime: {
          column: "interview.end_datetime",
          title: "End Date & Time",
          type: "datetimesecond",
          min: "start_datetime",
          max: "now",
          is_constant: () => 3 > CN_session.get("role", "tier"),
          help: "Will remain blank until the questionnaire is finished.",
        },
        note: {
          column: "interview.note",
          title: "Note",
          type: "text",
        },
      },
    });
  }
}
