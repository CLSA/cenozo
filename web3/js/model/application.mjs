import { CN_action_list } from "../element/action/list.mjs"
import { CN_action_view } from "../element/action/view.mjs"
import { CN_base_model } from "./base_model.mjs"
import { CN_common } from "../common.mjs"
import { CN_country_model } from "./country.mjs"
import { CN_session } from "../session.mjs"

export class CN_application_model extends CN_base_model {
  constructor() {
    super({
      wording: {
        singular: "application",
        plural: "applications",
        posessive: "application's",
      },
      columns: {
        title: { title: "Title" },
        application_type: { column: "application_type.name", title: "Type" },
        study_phase: { title: "Study Phase", table_prefix: false },
        version: { title: "Version" },
        active: { title: "Released", type: "boolean" },
        release_based: { title: "Released", type: "boolean" },
        site_based: { title: "Site Based", type: "boolean" },
        update_queue: { title: "Queued", type: "boolean" },
        participant_count: { title: "Participants", type: "number", table_prefix: false },
        site_count: { title: "Sites", type: "number", table_prefix: false },
      },
      properties: {
        name: { title: "Name", is_constant: () => true },
        title: {
          title: "Title",
          help: "A user-friendly name for the service, may contain any characters.",
        },
        application_type: {
          title: "Type",
          meta: { table: "application_type", column: "name" },
          is_constant: () => true,
        },
        study_phase_id: {
          title: "Study Phase",
          type: "enum",
          enum: {
            path: "study_phase",
            select: { column: {
              column: "CONCAT(study.name, ' ', study_phase.name)",
              alias: "name",
              table_prefix: false,
            } },
            modifier: { order: ["study.name", "study_phase.rank"] },
          },
        },
        url: {
          title: "URL",
          help: "The root web address of the application. This is used for intra-application communication.",
        },
        version: { title: "Version", is_constant: () => true },
        active: { title: "Active", type: "boolean" },
        release_based: {
          title: "Release Based",
          type: "boolean",
          is_constant: () => true,
          help: "Whether the application only has access to participants once they are released.",
        },
        site_based: {
          title: "Site Based",
          type: "boolean",
          help: "Whether the application assigns participants to sites based on jurisdictions or region-sites.",
        },
        update_queue: {
          title: "Update Queue",
          type: "boolean",
          help: "Whether the application has a queue which should be updated when changes are made to the database.",
        },
        primary_color: {
          title: "Primary Colour",
          type: "color",
          help: "The primary colour to use for the application's user interface.",
          on_change: async (form_input, valid) => {
            // run the default behaviour
            await form_input.get_action().on_property_change("primary_color", valid);

            // then reload the page so the new theme is generated
            if (valid) await CN_session.reload();
          },
        },
        secondary_color: {
          title: "Secondary Colour",
          type: "color",
          help: "The secondary colour to use for the application's user interface.",
          on_change: async (form_input, valid) => {
            // run the default behaviour
            await form_input.get_action().on_property_change("secondary_color", valid);

            // then reload the page so the new theme is generated
            if (valid) await CN_session.reload();
          },
        },
        login_footer: {
          title: "Login Footer",
          type: "text",
          help: "A message which is added after the login box.  This text may contain HTML markup.",
        },
        mail_name: {
          title: "Mail Name",
          help: 'The default value for the "From Name" field when sending emails.',
        },
        mail_address: {
          title: "Mail Address",
          help: 'The default value for the "From Address" field when sending emails.',
        },
        mail_header: {
          title: "Mail Header",
          type: "text",
          help: "A header which is added to all emails sent out by the application.  This text may contain HTML markup.",
        },
        mail_footer: {
          title: "Mail Footer",
          type: "text",
          help: "A footer which is added to all emails sent out by the application.  This text may contain HTML markup.",
        },
        country_id: { title: "Country", type: "typeahead", typeahead: CN_country_model.get_typeahead() },
        timezone: { title: "Default Timezone", type: "typeahead", typeahead: { list: CN_common.get_timezones() } },
        participant_count: { title: "Participants", meta: {}, is_constant: () => true },
        site_count: { title: "Sites", meta: {}, is_constant: () => true },
      },
    });
  }

  /**
   * Extend parent method
   */
  allow_view() {
    const parent_model = this.get_parent_model();
    return parent_model && "participant" == parent_model.get_name() ? false : super.allow_view();
  }
}

export class CN_application_view extends CN_action_view {
  /**
   * Extend the parent method to remove the collection and role list for all applications except the current one.
   * This is because only the current application can get collections and roles from the server.
   */
  get_selector_child_list() {
    return (
      CN_session.data.application.name == this.get_property_value("name") ?
      super.get_selector_child_list() :
      super.get_selector_child_list().filter(child => !["collection", "role"].includes(child.model.get_name()))
    );
  }
}

export class CN_application_list extends CN_action_list {
  /**
   * Extend the parent method
   */
  create_footer_element() {
    const footer_el = super.create_footer_element();

    // add the manage applications action view when participant is the parent model
    const parent_model = this.get_model().get_parent_model();
    if (parent_model && "participant" == parent_model.get_name()) {
      const manage_btn_el = this.constructor.html(`
        <button
          name="manage"
          type="button"
          class="btn btn-light btn-outline-primary"
        >Manage Applications</button>
      `);
      manage_btn_el.addEventListener("click", async () => {
        CN_session.navigate_to(`participant/release/${parent_model.get_identifier()}`);
      });
      footer_el.querySelector("div.btn-group").append(manage_btn_el);
    }

    return footer_el;
  }
}
