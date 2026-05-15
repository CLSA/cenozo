import { CN_base_model } from "./base_model.mjs"

export class CN_model_application_type extends CN_base_model {
  constructor() {
    super({
      wording: {
        singular: "application type",
        plural: "application types",
        posessive: "application type's",
      },
      columns: { name: { title: "Name" } },
    });
  }
}
