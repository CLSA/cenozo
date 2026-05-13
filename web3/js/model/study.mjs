import { CN_model_base } from "./base_model.mjs"

export class CN_model_study extends CN_model_base {
  constructor() {
    super({
      wording: {
        singular: "study",
        plural: "studies",
        posessive: "studies'",
      },
      columns: {
        name: { title: "Name" },
        consent_type: { column: "consent_type.name", title: "Consent Type" },
        completed_event_type: { column: "event_type.name", title: "Completed Event Type" },
        description: { title: "Description", type: "text" },
      },
      properties: {
        name: { title: "Name", format: "identifier" },
        consent_type_id: {
          title: "Extra Consent Type",
          type: "enum",
          enum: { path: "consent_type" },
          help: "If selected then participants have withdrawn from the study when this consent-type is negative.",
        },
        completed_event_type_id: {
          title: "Completed Event Type",
          type: "enum",
          enum: { path: "event_type" },
          help: "If selected then this event-type identifies when the study is complete.",
        },
        description: { title: "Description", type: "text" },
      },
    });
  }
}
