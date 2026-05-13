import { CN_model_base } from "./base_model.mjs"

export class CN_model_hin extends CN_model_base {
  constructor() {
    super({
      wording: {
        singular: "HIN",
        plural: "HINs",
        posessive: "HIN's",
      },
      columns: {
        region: { column: "region.name", title: "Region" },
        datetime: { title: "Date & Time", type: "datetime" },
      },
      properties: {
        code: { title: "Code" },
        region_id: {
          title: "Region",
          type: "enum",
          enum: {
            path: "region",
            select: { column: {
              column: "CONCAT(region.name, ', ', country.name)",
              alias: "name",
              table_prefix: false,
            } },
            modifier: {
              order: ["country.name", "region.name"],
            },
          },
          help: "The region from which the HIN is registered in.",
        },
        datetime: {
          title: "Date",
          type: "datetime",
          is_hidden: (model) => "add" == model.get_action_name(),
        },
      },
    });
  }

  /**
   * Extend parent method
   */
  allow_report() {
    // do not allow reports (exports) of HIN lists
    return false;
  }
}
