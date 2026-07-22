import { CN_base_model } from "./base_model.mjs"
import { CN_common } from "../common.mjs"

export class CN_model_site extends CN_base_model {
  constructor() {
    super({
      wording: {
        singular: "site",
        plural: "sites",
        posessive: "site's",
      },
      columns: {
        name: { title: "Name", },
      },
      properties: {
        name: { title: "Name", },
        timezone: { title: "Timezone", type: "typeahead", typeahead: { list: CN_common.get_timezones() } },
        phone_number: { title: "Phone Number", },
        address1: { title: "Address", },
        address2: { title: "Address (extra)", },
        city: { title: "City", },
        region_id: {
          title: "Province/State",
          type: "enum",
          enum: {
            path: "region",
            select: { column: {
              column: "CONCAT(region.name, ', ', country.name)",
              alias: "name",
              table_prefix: false,
            } },
            modifier: { order: ["country.name", "region.name"] },
          },
          is_constant: () => true,
          is_hidden: () => "add" == this.get_action_name(),
        },
        postcode: { title: "Postal or Zip Code", },
      },
    });
  }
}
