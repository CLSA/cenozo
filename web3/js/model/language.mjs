import { CN_base_model } from "./base_model.mjs"

export class CN_model_language extends CN_base_model {
  constructor() {
    super({
      wording: {
        singular: "language",
        plural: "languages",
        posessive: "language's",
      },
      columns: {
        name: { title: "Name" },
        code: { title: "Code" },
        active: { column: "language.active", title: "Active", type: "boolean" },
        participant_count: { title: "Participants", type: "integer", table_prefix: false },
        user_count: { title: "Users", type: "integer", table_prefix: false },
      },
      properties: {
        name: { title: "Name", is_constant: () => true },
        code: { title: "Code", is_constant: () => true },
        active: {
          title: "Active",
          type: "boolean",
          help: "Setting this to yes will make this language appear in language lists.",
        },
        participant_count: {
          meta: {}, // predefined by the service
          title: "Participants",
          is_constant: () => true,
          help: "Participants can only be added to this language by going directly to participant details.",
        },
      },
    });
  }
}
