import { CN_model_base } from "./base_model.mjs"

export class CN_model_application_type extends CN_model_base {
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
