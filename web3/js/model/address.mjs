import CN_api from "../api.mjs"
import CN_element from "../element.mjs"
import CN_session from "../session.mjs"

import { CN_traceable_model, CN_traceable_add, CN_traceable_list, CN_traceable_view } from "./traceable_model.mjs"
import { CN_country_model } from "./country.mjs"

export class CN_address_model extends CN_traceable_model {
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
          on_change: async (form_input, valid) => {
            // run the default behaviour
            await form_input.get_action().on_change("international", valid);

            // then update the element to propagate the changed property
            if (valid) form_input.get_action().update_element();
          },
          is_constant: (model) => "view" == model.get_action_name(),
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
          is_hidden: (model) => (
            "add" == model.get_action_name() ||
            model.get_action().get_property_value("international")
          ),
          is_constant: () => true,
          help: "The region cannot be changed directly, instead it is automatically updated based on the postcode.",
        },
        international_region: {
          title: "Region",
          type: "string",
          is_hidden: (model) => !(
            "add" == model.get_action_name() ?
            1 == model.get_action()
              .get_property("international")
              .form_input
              .render()
              .querySelector("select")
              .value :
            model.get_action().get_property_value("international")
          ),
          help: "International regions are unrestricted and are not automatically set by the postcode.",
        },
        international_country_id: {
          title: "Country",
          type: "typeahead",
          typeahead: CN_country_model.get_typeahead(),
          is_hidden: (model) => !(
            "add" == model.get_action_name() ?
            1 == model.get_action().get_property("international").form_input.get_value() :
            model.get_action().get_property_value("international")
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
          is_hidden: (model) => "add" == model.get_action_name(),
          help: "The number of hours difference between the address' timezone and UTC.",
        },
        daylight_savings: {
          title: "Daylight Savings",
          type: "boolean",
          is_hidden: (model) => "add" == model.get_action_name(),
          help: "Whether the address observes daylight savings.",
        },
        note: { title: "Note", type: "text" },

        months: {
          title: "Available Months",
          is_hidden: model => !model.get_action().get_property_value("active"),
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
}

export class CN_address_add extends CN_traceable_add {}
export class CN_address_list extends CN_traceable_list {}
export class CN_address_view extends CN_traceable_view {
  /**
   * Extends the parent method
   */
  async get_text(type) {
    if (["crumb", "name"].includes(type)) {
      return [
        this.get_property_value("rank"),
        this.get_property_value("city"),
      ].join(") ");
    }
    return await super.get_text(type);
  }

  /**
   * Add operations to the footer element
   */
  create_footer_element() {
    const footer_el = super.create_footer_element();

    // add the timezone action
    const timezone_btn_el = CN_element.create(
      '<button name="timezone" type="button" class="btn btn-light btn-outline-primary">Use Timezone</button>'
    );
    timezone_btn_el.addEventListener("click", async () => {
      await CN_session.set_timezone(
        { address_id: this.get_model().get_identifier() },
        CN_session.data.user.am_pm,
      );
    });
    footer_el.append(timezone_btn_el);

    return footer_el;
  }
}
