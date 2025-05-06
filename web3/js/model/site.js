import { PN_base_add } from "../base_add.js"
import { PN_base_model } from "../base_model.js"
import { PN_base_view } from "../base_view.js"

export class PN_site_model extends PN_base_model {
  constructor(module) {
    super(
      module,
      {
        name: {
          singular: "site",
          plural: "sites",
          posessive: "site's",
        },
        columns: {
          name: { title: "Name", },
        },
        properties: {
          name: { title: "Name", },
          timezone: {
            title: "Timezone",
            type: "typeahead",
            typeahead: {
              min_length: 2,
              list: moment.tz.names(),
            }
          },
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
                table: "region",
                column: "CONCAT(region.name, ', ', country.name)",
                alias: "name",
                table_prefix: false,
              } },
              modifier: { order: ["country.name", "region.name"] },
            },
            is_constant: () => true,
            is_hidden: (model) => model instanceof PN_base_add,
          },
          postcode: { title: "Postal or Zip Code", },
        },
      }
    );
  }
}
