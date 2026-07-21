import { CN_api } from "../api.mjs"
import { CN_common } from "../common.mjs"
import { CN_model_country } from "./country.mjs"
import { CN_session } from "../session.mjs"
import { CN_model_traceable, CN_add_traceable, CN_list_traceable, CN_view_traceable } from "./traceable_model.mjs"

export class CN_model_address extends CN_model_traceable {
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
            const action = form_input.get_action();

            // run the default behaviour
            await action.on_property_change("international", valid);

            // then update the element to propagate the changed property
            if (valid) action.update_element();
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
          help: `
            The region cannot be changed directly, instead it is automatically updated based on the postcode.
          `,
        },
        international_region: {
          title: "Region",
          type: "string",
          is_hidden: (model) => !model.get_action().get_property_value("international"),
          help: "International regions are unrestricted and are not automatically set by the postcode.",
        },
        international_country_id: {
          title: "Country",
          type: "typeahead",
          typeahead: CN_model_country.get_typeahead(),
          is_hidden: (model) => !model.get_action().get_property_value("international"),
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
          title: "Active Months",
          is_hidden: model => !model.get_action().get_property_value("active"),
          properties: CN_common.get_month().reduce((obj, month) => {
            obj[month.toLowerCase()] = { title: month, type: "boolean" };
            return obj;
          }, {}),
        },
      },
    });
  }
}

export class CN_add_address extends CN_add_traceable {
  /**
   * Add operations to the footer element
   */
  _create_footer_element() {
    const footer_el = super._create_footer_element();
    const left_btn_group_el = footer_el.querySelector("div[name=left-btn-group]");

    // add the activate/deactivate month buttons
    left_btn_group_el.append(this.constructor.html(`
      <div class="btn-group" role="group">
        <button
          name="months"
          type="button"
          class="btn btn-light btn-outline-primary dropdown-toggle"
          data-bs-toggle="dropdown"
        >Months</button>
        <ul class="dropdown-menu">
          <li><button name="activate" type="button" class="dropdown-item">Activate All</button></li>
          <li><button name="deactivate" type="button" class="dropdown-item">Deactivate All</button></li>
        </ul>
      </div>
    `));

    const set_months = async (active) => {
      await Promise.all(
        CN_common.get_month().map(month => month.toLowerCase()).map(
          month => (async () => {
            await this.set_property_value(month, active);
            await this.on_set_property(month);
          })()
        )
      );

      await this.run();
    };

    left_btn_group_el.querySelector("button[name=activate]").addEventListener("click", () => set_months(true));
    left_btn_group_el.querySelector("button[name=deactivate]").addEventListener("click", () => set_months(false));

    return footer_el;
  }
}

export class CN_list_address extends CN_list_traceable {}

export class CN_view_address extends CN_view_traceable {
  /**
   * Extends the parent method
   */
  async get_text(type) {
    if (["crumb", "name"].includes(type)) {
      return [this.get_property_value("rank"), this.get_property_value("city")].join(") ");
    }
    return await super.get_text(type);
  }

  /**
   * Add operations to the footer element
   */
  _create_footer_element() {
    const footer_el = super._create_footer_element();
    const left_btn_group_el = footer_el.querySelector("div[name=left-btn-group]");

    // add the timezone action
    const timezone_btn_el = this.constructor.html(
      '<button name="timezone" type="button" class="btn btn-light btn-outline-primary">Use Timezone</button>'
    );
    timezone_btn_el.addEventListener("click", async () => {
      await CN_session.set_timezone(
        { address_id: this.get_model().get_identifier() },
        CN_session.get("user", "am_pm"),
      );
    });
    left_btn_group_el.append(timezone_btn_el);

    // add the activate/deactivate month buttons
    left_btn_group_el.append(this.constructor.html(`
      <div class="btn-group" role="group">
        <button
          name="months"
          type="button"
          class="btn btn-light btn-outline-primary dropdown-toggle"
          data-bs-toggle="dropdown"
        >Months</button>
        <ul class="dropdown-menu">
          <li><button name="activate" type="button" class="dropdown-item">Activate All</button></li>
          <li><button name="deactivate" type="button" class="dropdown-item">Deactivate All</button></li>
        </ul>
      </div>
    `));

    const set_months = async (active) => {
      // determine which months need to be changed
      const data = {};
      CN_common.get_month().map(month => month.toLowerCase()).forEach(month => {
        if (active != this.get_property_value(month)) data[month] = active ? 1 : 0;
      });

      if (0 < Object.keys(data).length) {
        // update the server
        await CN_api.patch(this.get_model().get_view_url(null, "api"), data);

        // update the client
        const promise_list = [];
        for (const month in data) promise_list.push(this.set_property_value(month, active));
        await Promise.all(promise_list);
      }
    };

    left_btn_group_el.querySelector("button[name=activate]").addEventListener("click", () => set_months(true));
    left_btn_group_el.querySelector("button[name=deactivate]").addEventListener("click", () => set_months(false));

    return footer_el;
  }
}
