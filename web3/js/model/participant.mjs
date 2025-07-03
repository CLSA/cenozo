import CN_api from "../api.mjs"
import CN_session from "../session.mjs"

import { CN_base_model } from "../base_model.mjs"
import { CN_base_view } from "../base_view.mjs"

export class CN_participant_model extends CN_base_model {
  constructor() {
    const columns = {
      uid: { title: "UID" },
      first_name: { title: "First Name" },
      last_name: { title: "Last Name" },
      cohort: { column: "cohort.name", title: "Cohort" },
      status: { title: "Status", table_prefix: false },
    };
    // only add the site column if this is a site-based application
    if (CN_session.data.application.site_based) {
      columns.site = { column: "site.name", title: "Site" };
    }
    columns.global_note = { title: "Special Note", type: "text", limit: 20 };

    super({
      wording: {
        singular: "participant",
        plural: "participants",
        posessive: "participant's",
      },
      columns: columns,
      properties: {
        uid: { title: "UID", is_constant: (model) => true },
        cohort: {
          column: "cohort.name",
          title: "Cohort",
          meta: { table: "cohort", column: "name" },
          is_constant: (model) => true,
        },
        status: {
          title: "Status",
          meta: { column: "status" },
          is_constant: (model) => true
        },
        global_note: { title: "Special Note", type: "text" },

        naming: {
          title: "Naming Details",
          properties: {
            honorific: {
              title: "Honorific",
              help: 
                "English examples: Mr. Mrs. Miss Ms. Dr. Prof. Br. Sr. Fr. Rev. Pr.<br/>" +
                "Exemples français: M. Mme Dr Dre Prof. F. Sr P. Révérend Pasteur Pasteure Me",
            },
            first_name: { title: "First Name" },
            other_name: { title: "Other/Nickname" },
            last_name: { title: "Last Name" },
          },
        },

        status_details: {
          title: "Status Details",
          properties: {
            exclusion: {
              title: "Enrolled",
              meta: { column: "exclusion" },
              is_constant: (model) => true,
              help: "Whether the participant has been enrolled into the study, and if not then the reason they have been excluded.",
            },
            hold: {
              title: "Hold",
              meta: { column: "hold" },
              action: {
                title: "Change",
                onclick: async () => { CN_session.navigate_to(`${this.get_view_url()}/hold/add`); },
              },
              is_constant: (model) => true,
            },
            trace: {
              title: "Trace",
              meta: { column: "trace" },
              action: {
                title: "Change",
                onclick: async () => { CN_session.navigate_to(`${this.get_view_url()}/trace/add`); },
              },
              is_constant: (model) => true,
            },
            proxy: {
              title: "Proxy",
              meta: { column: "proxy" },
              action: {
                title: "Change",
                onclick: async () => { CN_session.navigate_to(`${this.get_view_url()}/proxy/add`); },
              },
              is_constant: (model) => true,
            },
          },
        },

        defining_details: {
          title: "Defining Details",
          properties: {
            source: {
              title: "Source",
              meta: { table: "source", column: "name" },
              is_constant: (model) => true,
            },
            sex: {
              title: "Sex at Birth",
              is_constant: (model) => true,
            },
            gender_identity: { title: "Gender Identity", type: "enum" },
            pronouns: { title: "Pronouns" },
            date_of_birth: {
              title: "Date of Birth",
              type: "dob",
              max: "now",
              is_constant: (model) => 3 <= CN_session.data.role.tier,
            },
            date_of_death: {
              title: "Date of Death",
              type: "dod",
              min: "date_of_birth",
              max: "now",
              is_constant: (model) => true,
            },
            date_of_death_accuracy: {
              title: "Date of Death Accuracy",
              type: "enum",
              is_constant: (model) => true,
              /*
                TODO: is constant should be
                  angular.isUndefined(model.viewModel.record.date_of_death) ||
                  null == model.viewModel.record.date_of_death
              */              
              help: "Defines how accurate the date of death is.",
            },
            date_of_death_ministry: {
              title: "Death Confirmed by Ministry",
              type: "boolean",
              help: "Determines whether information about the participant's death is confirmed by a ministry",
              is_constant: (model) => true,
              /*
                TODO: is constant should be
                  angular.isUndefined(model.viewModel.record.date_of_death) ||
                  null == model.viewModel.record.date_of_death
              */
            },
            language_id: {
              title: "Preferred Language",
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
        },

        contact_details: {
          title: "Contact Details",
          properties: {
            callback: { title: "Callback", type: "datetime", min: "now" },
            availability_type_id: {
              title: "Availability Preference",
              type: "enum",
              enum: { path: "availability_type" },
            },
            out_of_area: {
              title: "Out of Area",
              type: "boolean",
              help: "Whether the participant lives outside of the study's serviceable area",
            },
            email: { title: "Email", type: "email" },
            email2: { title: "Alternate Email", type: "email" },
            mass_email: {
              title: "Mass Emails",
              type: "boolean",
              help:
          "Whether the participant wishes to be included in mass emails such as newsletters, " +
          "holiday greetings, etc.",
            },
          },
        },
      },
    });
  }
}

export class CN_participant_view extends CN_base_view {
  /**
   * Extends the parent method
   */
  async get_text(type) {
    if ("name" == type) {
      return [
        this.get_property("last_name").state.get(),
        this.get_property("first_name").state.get(),
      ].join(", ");
    }
    return await super.get_text(type);
  }
}
