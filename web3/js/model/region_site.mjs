import { CN_base_model } from "./base_model.mjs"
import { CN_session } from "../session.mjs"

export class CN_model_region_site extends CN_base_model {
  constructor() {
    super({
      wording: {
        singular: "region site",
        plural: "region sites",
        posessive: "region site's",
      },
      columns: {
        site: { column: "site.name", title: "Site" },
        region: { column: "region.name", title: "Region" },
        language: { column: "language.name", title: "Language" },
      },
      properties: {
        site_id: {
          meta: { table: "region_site", column: "site_id" },
          title: "Site",
          type: "enum",
          enum: { path: "site" },
        },
        region_id: {
          meta: { table: "region_site", column: "region_id" },
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
              where: { column: "country.name", operator: "=", value: CN_session.get("application", "country") },
              order: ["country.name", "region.name"],
            },
          },
        },
        language_id: {
          meta: { table: "region_site", column: "language_id" },
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
      },
    });
  }
}
