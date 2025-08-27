import CN_api from "../api.mjs"
import CN_common from "../common.mjs"
import CN_element from "../element.mjs"
import CN_session from "../session.mjs"

import { CN_base_action } from "../base_action.mjs"
import { CN_base_model } from "../base_model.mjs"
import { CN_base_person_view, CN_base_person_history, CN_base_person_notes } from "../base_person_model.mjs"

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
        uid: { title: "UID", is_constant: () => true },
        cohort: {
          column: "cohort.name",
          title: "Cohort",
          meta: { table: "cohort", column: "name" },
          is_constant: () => true,
        },
        status: {
          title: "Status",
          meta: true,
          is_constant: () => true
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
              meta: true,
              is_constant: () => true,
              help: "Whether the participant has been enrolled into the study, and if not then the reason they have been excluded.",
            },
            hold: {
              title: "Hold",
              meta: true,
              action: {
                title: "Change",
                onclick: async () => { CN_session.navigate_to(`${this.get_view_url()}/hold/add`); },
              },
              is_constant: () => true,
            },
            trace: {
              title: "Trace",
              meta: true,
              action: {
                title: "Change",
                onclick: async () => { CN_session.navigate_to(`${this.get_view_url()}/trace/add`); },
              },
              is_constant: () => true,
            },
            proxy: {
              title: "Proxy",
              meta: true,
              action: {
                title: "Change",
                onclick: async () => { CN_session.navigate_to(`${this.get_view_url()}/proxy/add`); },
              },
              is_constant: () => true,
            },
          },
        },

        defining_details: {
          title: "Defining Details",
          properties: {
            source: {
              title: "Source",
              meta: { table: "source", column: "name" },
              is_constant: () => true,
            },
            sex: {
              title: "Sex at Birth",
              is_constant: () => true,
            },
            gender_identity: { title: "Gender Identity", type: "enum" },
            pronouns: { title: "Pronouns" },
            date_of_birth: {
              title: "Date of Birth",
              type: "dob",
              max: "now",
              is_constant: () => 3 <= CN_session.data.role.tier,
            },
            date_of_death: {
              title: "Date of Death",
              type: "dod",
              min: "date_of_birth",
              max: "now",
            },
            date_of_death_accuracy: {
              title: "Date of Death Accuracy",
              type: "enum",
              is_constant: (model) => !model.get_action().get_property("date_of_death").state.get(),
              help: "Defines how accurate the date of death is.",
            },
            date_of_death_ministry: {
              title: "Death Confirmed by Ministry",
              type: "boolean",
              is_constant: (model) => !model.get_action().get_property("date_of_death").state.get(),
              help: "Determines whether information about the participant's death is confirmed by a ministry",
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

  /**
   * Override the default get_base_path() method for certain parent models.
   * This is because there is no direct relationship between participant and those models.
   */
  get_base_path(type) {
    const parent_model = this.get_parent_model();
    const model_list = [
      "consent_type",
      "event_type",
      "hold_type",
      "proxy_type",
      "trace_type"
    ];
    return (
      "url" == type && parent_model && model_list.includes(parent_model.get_name()) ?
      "participant" :
      super.get_base_path(type)
    );
  }
}

export class CN_participant_view extends CN_base_person_view {
  /**
   * Extends the parent method
   */
  async get_text(type) {
    if (["crumb", "name"].includes(type)) {
      return this.get_property("uid").state.get();
    }
    return await super.get_text(type);
  }

  /**
   * Add operation to the footer element
   */
  create_footer_element() {
    const model = this.get_model();
    const footer_el = super.create_footer_element();

    // add the scripts action
    const token_module = CN_session.get_module("token");
    if (token_module && token_module.action_allowed("add")) {
      const scripts_btn_el = CN_element.create(
        '<button name="scripts" type="button" class="btn btn-light btn-outline-primary">Scripts</button>'
      );
      scripts_btn_el.addEventListener("click", async () => {
        CN_session.navigate_to([model.get_base_path("url"), "scripts", model.get_identifier()].join("/"));
      });
      footer_el.append(scripts_btn_el);
    }

    return footer_el;
  }
}

export class CN_participant_history extends CN_base_person_history {}

export class CN_participant_notes extends CN_base_person_notes {}

export class CN_participant_scripts extends CN_base_action {
  #script_list = [];
  #reverse_messages = {
    Proxy:
      "Are you sure you wish to reverse the participant's proxy status?<br/><br/>" +
      "By selecting yes you are confirming that the participant has decided to re-consider their proxy status.",
    Withdraw:
      "Are you sure you wish to reverse the participant's withdraw status?<br/><br/>" +
      "By selecting yes you are confirming that the participant has re-consented to participate in the study.",
  };

  /**
   * Constructor
   * @param base_model model: The model that the action belongs to
   */
  constructor(model) {
    super("notes", model);
  }

  /**
   * Extend parent method
   */
  async get_text(type) {
    if ("crumb" == type) {
      return (await CN_api.get(
        `participant/${this.get_model().get_identifier()}`,
        { select: { column: "uid" },
      })).uid;
    }

    if ("header" == type) {
      const data = await CN_api.get(`participant/${this.get_model().get_identifier()}`, {
        select: { column: ["uid", "first_name", "last_name"] },
      });
      return `Utility scripts for ${data.first_name} ${data.last_name} (${data.uid})`;
    }

    return super.get_text(type);
  }

  /**
   * Extend parent method
   */
  async on_navigate_to_parent() {
    await CN_session.navigate_to(`participant/view/${this.get_model().get_identifier()}`);
  }

  /**
   * Extend parent method
   */
  async on_load() {
    await super.on_load();

    // get the script list for this application
    this.#script_list = await CN_api.get(`application/${CN_session.data.application.id}/script`, {
      select: { column: ["id", "name", "url"] },
      modifier: {
        where: {
          column: "supporting",
          operator: "=",
          value: true,
        },
        order: "name",
      },
    });

    // load the participant's status for all utility scripts in parallel
    await Promise.all(
      this.#script_list.map(script => {
        const get_script_status = async () => {
          script.token = null;
          script.end_datetime = null;
          try {
            const data = await CN_api.get(
              `script/${script.id}/pine_response/${this.get_model().get_identifier()}`
            );
            script.token = data.token;
            script.end_datetime = data.end_datetime;
          } catch (error) {
            // ignore 404
            if (404 != error.response.status) throw error;
          }
        };

        return get_script_status();
      })
    );
  }

  /**
   * Extend parent method
   */
  update_element() {
    const script_list_el = this.get_body_element().querySelector("[name=script_list]");

    script_list_el.innerHTML = "";
    this.#script_list.forEach(script => {
      const reversable = this.#reverse_messages.hasOwnProperty(script.name);
      const disabled = script.end_datetime && !reversable;
      let title = `Launch ${script.name}`;

      if (script.end_datetime) {
        title = (
          reversable ?
          `Reverse ${script.name} (completed on ${CN_common.format_datetime(script.end_datetime, "datetime")})` :
          `${script.name} Completed (${CN_common.format_datetime(script.end_datetime, "datetime")})`
        );
      }
      const btn_el = CN_element.create(
        `<button
          type="button"
          class="btn btn-outline-primary w-100"
          ${disabled ? "disabled" : ""}
        >${title}</button>`
      );
      btn_el.addEventListener("click", async () => {
        if (script.end_datetime) {
          if (reversable) {
            const modal = CN_element.confirm_modal({
              static: true,
              title: `Reverse ${script.name}`,
              message: this.#reverse_messages[script.name],
            });

            if (await modal.test()) {
              await CN_element.wait_for(async () => {
                const params = {};
                params[`reverse_${script.name.replace(/ /, "_").toLowerCase()}`] = true;
                await CN_api.patch(`participant/${this.get_model().get_identifier()}`, params);
                await this.run();
              });
            }
          }
        } else {
          // request a token if one doesn't already exist
          if (null == script.token) {
            await CN_element.wait_for(async () => {
              const response = await CN_api.post(`script/${script.id}/pine_response`, {
                identifier: this.get_model().get_identifier(),
              })
              script.token = (await response.json()).token;
            });
          }

          // if we still don't have a token then there's a problem
          if (null == script.token) {
            CN_element.message_modal({
              title: "Respondent Not Found",
              message:
                "Unable to find the respondent record belonging to the script you are trying to launch. " +
                "If the problem persists please contact support.",
              type: "danger",
            }).show();
          } else {
            // launch the sript
            const url_params = {
              show_hidden: 1,
              site: CN_session.data.site.name,
              username: CN_session.data.user.name,
            };
            const params = (new URLSearchParams(url_params)).toString()
            window.open(
              `${script.url}${script.token}?${params}`,
              `script_${script.id}`
            ).focus();

            // re-run the action once the user returns to this tab
            const regained_focus = async () => {
              await this.run();
              window.removeEventListener("focus", regained_focus);
            };
            window.addEventListener("focus", regained_focus);
          }
        }
      });
      script_list_el.append(btn_el);
    });
  }

  /**
   * Extend parent method
   */
  create_placeholder_element() {
    return CN_element.create(`
      <div>
        <div class="text-info pb-2">
          Select which utility script you wish to launch on behalf of the participant.
        </div>
        <div name="script_list">
          <button type="button" class="btn btn-outline-primary placeholder-glow w-100" disabled>
            <span class="placeholder placeholder-lg col-${Math.ceil(Math.random()*3)+1}"></span>
          </button>
          <button type="button" class="btn btn-outline-primary placeholder-glow w-100" disabled>
            <span class="placeholder placeholder-lg col-${Math.ceil(Math.random()*3)+1}"></span>
          </button>
          <button type="button" class="btn btn-outline-primary placeholder-glow w-100" disabled>
            <span class="placeholder placeholder-lg col-${Math.ceil(Math.random()*3)+1}"></span>
          </button>
        </div>
      </div>
    `);
  }

  /**
   * Extend parent method
   */
  create_body_element() {
    const body_el = CN_element.create(`
      <div>
        <div class="text-info pb-2">
          Select which utility script you wish to launch on behalf of the participant.
        </div>
        <div name="script_list"></div>
      </div>
    `);

    return body_el;
  }

  /**
   * Extend parent method
   */
  create_footer_element() {
    const footer_el = CN_element.create(`
      <div class="btn-group" role="group">
        <button name="back" type="button" class="btn btn-primary">View Participant</button>
      </div>
    `);

    footer_el.querySelector("button[name=back]").addEventListener(
      "click",
      async () => await this.on_navigate_to_parent()
    );

    return footer_el;
  }
}
