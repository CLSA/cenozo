import { CN_base_model } from "./base_model.mjs"

export class CN_model_proxy_type extends CN_base_model {
  constructor() {
    super({
      wording: {
        singular: "proxy type",
        plural: "proxy types",
        posessive: "proxy type's",
      },
      columns: {
        name: { title: "Name" },
        participant_count: { title: "Participants", type: "integer", table_prefix: false },
        role_list: { title: "Roles", table_prefix: false },
        description: { title: "Description", type: "text" },
      },
      properties: {
        name: { title: "Name", format: "identifier" },
        description: { title: "Description", type: "text" },
        prompt: {
          title: "Prompt",
          type: "text",
          help: `
            This message will appear to any user adding this proxy type asking to
            confirm whether they wish to proceed.
          `,
        },
      },
    });
  }
}
