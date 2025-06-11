import CN_session from "../session.js"

import { CN_base_add } from "../base_add.js"
import { CN_base_model } from "../base_model.js"
import { CN_base_view } from "../base_view.js"

export class CN_address_model extends CN_base_model {
  constructor(module) {
    super(
      module,
      {
        name: {
          singular: "address",
          plural: "addresses",
          posessive: "address'",
        },
        columns: {
          rank: { title: "Rank", type: "rank" },
          city: { title: "City" },
          region: { column: "region.name", title: "Region" },
          active: { title: "Active", type: "boolean" },
          available: {
            title: "Available",
            type: "boolean",
            table_prefix: false,
            help: "Whether the address is active in the current month.",
          },
        },
        properties: {
          active: { title: "Active", type: "boolean" },
          rank: { title: "Rank", type: "rank" },
          international: {
            title: "International",
            type: "boolean",
            help: "Cannot be changed once the address has been created.",
            onchange: async (control_el, success, model) => {
              if (success) {
                // update the element to propagate the change to the international property
                await model.on_set_property("international");
                model.update_element();
              } else {
                model.undo_state("international");
              }
            },
            is_constant: (model) => model instanceof CN_base_view,
          },
          address1: { title: "Address Line 1", type: "string" },
          address2: { title: "Address Line 2", type: "string" },
          city: { title: "City", type: "string", },
          region_id: {
            title: "Region",
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
            is_hidden: (model) => model instanceof CN_base_add || model.get_state("international"),
            is_constant: () => true,
            help: "The region cannot be changed directly, instead it is automatically updated based on the postcode.",
          },
          international_region: {
            title: "Region",
            type: "string",
            is_hidden: (model) => !(
              model instanceof CN_base_add ?
              1 == model.properties.international.element.querySelector("select").value :
              model.get_state("international")
            ),
            help: "International regions are unrestricted and are not automatically set by the postcode.",
          },
          international_country_id: {
            title: "Country",
            type: "typeahead",
            typeahead: {
              get_list: async (value) => {
                const response = await CN_api.get("country", {
                  select: {
                    column: [
                      { column: "id", alias: "key" },
                      { column: "name", alias: "value" },
                    ],
                  },
                  modifier: {
                  },
                });
                return (await response.json());
              },
            },
            is_hidden: (model) => !(
              model instanceof CN_base_add ?
              1 == model.properties.international.element.querySelector("select").value :
              model.get_state("international")
            ),
          },
          postcode: {
            title: "Postcode",
            type: "string",
            help: 'Non-international postal codes must be in "A1A 1A1" format, zip codes in "01234" format.',
          },
          timezone_offset: {
            title: "Timezone Offset",
            type: "float",
            is_hidden: (model) => model instanceof CN_base_add,
            help: "The number of hours difference between the address' timezone and UTC.",
          },
          daylight_savings: {
            title: "Daylight Savings",
            type: "boolean",
            is_hidden: (model) => model instanceof CN_base_add,
            help: "Whether the address observes daylight savings.",
          },
          note: { title: "Note", type: "text" },
          // months: { title: "Active Months", type: "months" },
        },
      }
    );
  }

  /**
   * Extends the parent method
   */
  get_base_path(type) {
    // restrict the application address list by application-type
    return (
      "application" == this.get_parent_module().subject ?
      `application_type/${CN_session.data.application.application_type_id}/address` :
      super.get_base_path(type)
    );
  }
}

export class CN_address_view extends CN_base_view {
  get_text(type) {
    if ("name" == type) {
      return `${this.get_state("rank")}) ${this.get_state("city")}`;
    }
    return super.get_text(type);
  }
}
