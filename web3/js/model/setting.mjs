import { CN_model_base } from "./base_model.mjs"

export class CN_model_setting extends CN_model_base {
  constructor() {
    super({
      wording: {
        singular: "setting",
        plural: "settings",
        posessive: "setting's",
      },
      columns: {
        site: { column: "site.name", title: "Site" },
      },
      properties: {
        site: {
          meta: { table: "site", column: "name" },
          title: "Site",
          is_constant: () => true,
        },
      },
    });
  }
}
