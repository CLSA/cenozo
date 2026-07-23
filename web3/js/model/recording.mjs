import { CN_base_model } from "./base_model.mjs"

export class CN_model_recording extends CN_base_model {
  constructor() {
    super({
      wording: {
        singular: "recording",
        plural: "recordings",
        posessive: "recording's",
      },
      columns: {
        rank: { title: "Rank", type: "rank" },
        name: { title: "Name" },
        record: { title: "Record", type: "boolean" },
        timer: { title: "Timer" },
      },
      properties: {
        rank: { title: "Rank", type: "rank" },
        name: { title: "Name" },
        record: {
          title: "Record",
          type: "boolean",
          help: "Whether the participant should be recorded during this stage.",
        },
        timer: {
          title: "Timer",
          type: "integer",
          get_min: () => 1,
          help: "The number of seconds to limit the stage to (empty meaning no limit).",
        },
      },
    });
  }
}
