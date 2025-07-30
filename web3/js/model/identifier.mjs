import { CN_base_model } from "../base_model.mjs"

export class CN_identifier_model extends CN_base_model {
  constructor() {
    super({
      wording: {
        singular: "identifier",
        plural: "identifiers",
        posessive: "identifier's",
      },
      columns: {
        name: { title: "Name" },
        locked: { title: "Locked", type: "boolean" },
        regex: { title: "Format" },
        description: { title: "Description", type: "text" },
      },
      properties: {
        name: { title: "Name", format: "identifier" },
        locked: {
          title: "Locked",
          type: "boolean",
          help: "If locked then participant identifiers cannot be added, changed or removed.",
        },
        regex: {
          title: "Format",
          help: "This is a regular expression used to make sure all identifiers follow a particular format.",
        },
        description: { title: "Description", type: "text" },
      }
    });
  }
}

// TODO: implement "Import Participant Identifiers" extra view operation
