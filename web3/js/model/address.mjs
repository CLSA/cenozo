import CN_session from "../session.mjs"

import { CN_base_model } from "../base_model.mjs"
import { CN_base_view } from "../base_view.mjs"

export class CN_address_model extends CN_base_model {
  constructor() {
    super({
      wording: {
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
              model.get_property("international").state.undo();
            }
          },
          is_constant: (model) => "view" == model.get_type(),
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
              column: "CONCAT(region.name, ', ', country.name)",
              alias: "name",
              table_prefix: false,
            } },
            modifier: { order: ["country.name", "region.name"] },
          },
          is_hidden: (model) => "add" == model.get_type() || model.get_property("international").state.get(),
          is_constant: () => true,
          help: "The region cannot be changed directly, instead it is automatically updated based on the postcode.",
        },
        international_region: {
          title: "Region",
          type: "string",
          is_hidden: (model) => !(
            "add" == model.get_type() ?
            1 == model.get_property("international").element.querySelector("select").value :
            model.get_property("international").state.get()
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
            "add" == model.get_type() ?
            1 == model.get_property("international").element.querySelector("select").value :
            model.get_property("international").state.get()
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
          is_hidden: (model) => "add" == model.get_type(),
          help: "The number of hours difference between the address' timezone and UTC.",
        },
        daylight_savings: {
          title: "Daylight Savings",
          type: "boolean",
          is_hidden: (model) => "add" == model.get_type(),
          help: "Whether the address observes daylight savings.",
        },
        note: { title: "Note", type: "text" },

        months: {
          title: "Available Months",
          properties: {
            january: { title: "January", type: "boolean" },
            february: { title: "February", type: "boolean" },
            march: { title: "March", type: "boolean" },
            april: { title: "April", type: "boolean" },
            may: { title: "May", type: "boolean" },
            june: { title: "June", type: "boolean" },
            july: { title: "July", type: "boolean" },
            august: { title: "August", type: "boolean" },
            september: { title: "September", type: "boolean" },
            october: { title: "October", type: "boolean" },
            november: { title: "November", type: "boolean" },
            december: { title: "December", type: "boolean" },
          },
        },
      },
    });
  }

  /**
   * Extends the parent method
   */
  get_base_path(type) {
    // restrict the application address list by application-type
    return (
      "application" == this.get_parent_module().name ?
      `application_type/${CN_session.data.application.application_type_id}/address` :
      super.get_base_path(type)
    );
  }
}

export class CN_address_view extends CN_base_view {
  /**
   * Extends the parent method
   */
  async get_text(type) {
    if ("name" == type) {
      return [
        this.get_property("rank").state.get(),
        this.get_property("city").state.get(),
      ].join(") ");
    }
    return await super.get_text(type);
  }
}
