import { CN_base_model } from "../base_model.mjs"

export class CN_script_model extends CN_base_model {
  constructor() {
    super({
      wording: {
        singular: "script",
        plural: "scripts",
        posessive: "script's",
      },
      columns: {
        name: { column: "script.name", title: "Name" },
        application: { title: "Application" },
        supporting: { title: "Supporting", type: "boolean" },
        repeated: { title: "Repeated", type: "boolean" },
        total_pages: { title: "Pages" },
        access: { title: "In Application", type: "boolean", table_prefix: false },
      },
      properties: {
        name: { title: "Name", format: "identifier", },
        pine_qnaire_id: {
          title: "Pine Questionnaire",
          type: "enum",
          enum: { path: "pine_qnaire" },
        },
        supporting: {
          title: "Supporting",
          type: "boolean",
          help: 'Identifies this as a supporting script (launched in the "Scripts" dropdown when viewing a participant)',
        },
        repeated: { title: "Repeated", type: "boolean", },
        total_pages: {
          title: "Total Number of Pages",
          is_constant: () => true,
          is_hidden: (model) => "add" == model.get_action_name(),
          help: "Updated nightly from Pine.",
        },
        create_event_types: {
          title: "Create Start/Finish Event Types",
          type: "boolean",
          meta: {}, // predefined by the service
          is_hidden: (model) => "view" == model.get_action_name(),
          help: "Only used when creating a non-repeating script.",
        },
        started_event_type_id: {
          title: "Started Event Type",
          type: "enum",
          enum: { path: "event_type" },
          is_hidden: (model) => "add" == model.get_action_name(),
        },
        finished_event_type_id: {
          title: "Finished Event Type",
          type: "enum",
          enum: { path: "event_type" },
          is_hidden: (model) => "add" == model.get_action_name(),
        },
        description: { title: "Description", type: "text", },
      },
    });
  }
}
