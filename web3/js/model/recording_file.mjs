import { CN_base_model } from "./base_model.mjs"

export class CN_model_recording_file extends CN_base_model {
  constructor() {
    super({
      wording: {
        singular: "recording file",
        plural: "recording files",
        posessive: "recording file's",
      },
      columns: {
        language: { column: "language.name", title: "Language" },
        filename: { title: "Filename" },
      },
      properties: {
        language_id: {
          title: "Language",
          type: "enum",
          enum: {
            path: "language",
            modifier: {
              where: { column: "active", operator: "=", value: true },
              order: "language.name",
            },
          },
        },
        filename: { title: "Filename", help: "The name of the file on the asterisk server." },
      },
    });
  }
}
