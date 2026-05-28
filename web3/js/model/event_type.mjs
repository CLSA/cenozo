import { CN_base_model } from "./base_model.mjs"

export class CN_model_event_type extends CN_base_model {
  constructor() {
    super({
      wording: {
        singular: "event type",
        plural: "event types",
        posessive: "event type's",
      },
      columns: {
        name: { title: "Name" },
        event_count: { title: "Events", type: "integer", table_prefix: false },
        role_list: { title: "Roles", table_prefix: false },
        description: { title: "Description", type: "text" },
      },
      properties: {
        name: { title: "Name", format: "identifier" },
        record_address: {
          title: "Track Address",
          type: "boolean",
          help: "Whether to record the participant's primary address at the time the event is created.",
        },
        description: { title: "Description", type: "text" },
      },
    });
  }
}
