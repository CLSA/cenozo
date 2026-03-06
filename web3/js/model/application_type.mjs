import { CN_base_model } from "./base_model.mjs"

export class CN_application_type_model extends CN_base_model {
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
