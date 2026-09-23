import { CN_base_model } from "./base_model.mjs"
import { CN_session } from "../session.mjs"

export class CN_model_jurisdiction extends CN_base_model {
  constructor() {
    super({
      wording: {
        singular: "jurisdiction",
        plural: "jurisdictions",
        posessive: "jurisdiction's",
      },
      columns: {
        site: { column: "site.name", title: "Site" },
        postcode: { column: "jurisdiction.postcode", title: "Postcode" },
        longitude: { title: "Longitude" },
        latitude: { title: "Latitude" },
      },
      properties: {
        site_id: {
          meta: { table: "jurisdiction", column: "site_id" },
          title: "Site",
          type: "enum",
          enum: { path: "site" },
        },
        postcode: {
          title: "Postcode",
          regex: "^(([A-Z][0-9][A-Z] [0-9][A-Z][0-9])|([0-9]{5}))$",
          help: 'Non-international postal codes must be in "A1A 1A1" format, zip codes in "01234" format.',
        },
        longitude: {
          title: "Longitude",
          type: "float",
        },
        latitude: {
          title: "Latitude",
          type: "float",
        },
      },
    });
  }
}
