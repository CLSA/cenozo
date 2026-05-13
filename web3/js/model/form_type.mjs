import { CN_model_base } from "./base_model.mjs"

export class CN_model_form_type extends CN_model_base {
  constructor() {
    super({
      wording: {
        singular: "form type",
        plural: "form types",
        posessive: "form type's",
      },
      columns: {
        title: { title: "Title" },
        form_count: { title: "Forms", type: "integer", table_prefix: false },
        description: { title: "Description", type: "text" },
      },
      properties: {
        name: { title: "Name" },
        title: { title: "Title" },
        description: { title: "Description", type: "text" },
      },
    });
  }
}
