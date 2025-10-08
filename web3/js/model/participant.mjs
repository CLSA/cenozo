import CN_api from "../api.mjs"
import CN_common from "../common.mjs"
import CN_element from "../element.mjs"
import CN_session from "../session.mjs"

import { CN_base_action } from "../base_action.mjs"
import { CN_base_person_model, CN_base_person_view, CN_base_person_history, CN_base_person_notes }
  from "../base_person_model.mjs"

export function create_participant_selection(unique_id=null) {
  let identifier_list = [];

  let list_id = "cps_list";
  if (null != unique_id) list_id = `${unique_id}-${list_id}`;

  let identifier_id = "cps_identifier_id";
  if (null != unique_id) identifier_id = `${unique_id}-${identifier_id}`;


  const el = CN_element.create_card({
    header: "Participant Selection",
    body: CN_element.create_form_element("text", {
      id: list_id,
      /*
      on_change: (control_el) => {
        console.log(control_el.value);
//        el.querySelector("button[name=confirm]").removeAttribute("disabled);
      },
      */
    }),
    footer: CN_element.create('<div class="row"></div>'),
  });

  const row_el = el.querySelector("div.row");
  const label_el = CN_element.create_form_label({ for: identifier_id, value: "Identifier" });
  label_el.classList.add("col-sm-3");
  row_el.append(label_el);
  const element_el = CN_element.create_form_element("enum", {
    id: identifier_id,
    required: true,
    // add the confirm button as a postfix to the identifier selector
    set_postfix: () => CN_element.create(
      '<button name="confirm" type="button" class="btn btn-primary ms-2" disabled>Confirm List</button>'
    ),
  });
  element_el.classList.add("col-sm-9");
  row_el.append(element_el);

  const select_el = el.querySelector("select");
  const confirm_btn_el = el.querySelector("button[name=confirm]");
  const list_control_el = el.querySelector("textarea");

  // populate the identifier selection list
  select_el.setAttribute("disabled", "disabled");
  CN_api.get("identifier", {
    select: { column: ["id", "name", "regex"] },
    modifier: { order: "name" },
  }).then(response => {
    identifier_list = response;
    select_el.append(CN_element.create('<option value="null" selected>UID</option>'));
    identifier_list.forEach(identifier => {
      select_el.append(CN_element.create(`<option value="${identifier.id}">${identifier.name}</option>`));
    });
    select_el.removeAttribute("disabled");
  });

  // set the confirm button's disabled state to whether the list has any text in it
  list_control_el.addEventListener("input", () => {
    if (0 < list_control_el.value.length) {
      confirm_btn_el.removeAttribute("disabled");
    } else {
      confirm_btn_el.setAttribute("disabled", "disabled");
    }
  });

  // implement the confirm button
  confirm_btn_el.addEventListener(
    "click",
    async () => {
      const data = {};

      // get the identifier's regex
      const id = Number(document.getElementById(identifier_id).value);
      let re = null;
      if (id) {
        data.identifier_id = id;
        const regex = identifier_list.find(identifier => id === identifier.id).regex;
        if (regex) re = new RegExp(regex);
      }

      // clean up the identifier list
      data.identifier_list = document.getElementById(list_id).value
        .toUpperCase()
        // replace whitespace and separation chars with a space
        .replace(/[\s,;|\/]/g, " ")
        // remove extra space
        .replace(/ +/g, " ")
        // remove anything that isn't a letter, number, underscore or space
        .replace(/[^a-zA-Z0-9_ ]/g, "")
        // delimite string by spaces and create array from result
        .split(" ")
        // match the identifier's regex
        .filter(identifier => null == re || null != identifier.match(re))
        // make array unique
        .filter((identifier, index, array) => index <= array.indexOf(identifier))
        .sort();

      // confirm with the server which identifiers are valid
      const value = (await CN_api.post("participant", data)).join(" ");
      document.getElementById(list_id).value = value;

      if (0 == value.length) confirm_btn_el.setAttribute("disabled", "disabled");
    },
  );

  return el;
}

export class CN_participant_model extends CN_base_person_model {
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
              set_postfix: () => {
                const btn_el = CN_element.create(
                  '<button type="button" class="btn btn-outline-primary ms-2">Change</button>'
                );
                btn_el.addEventListener(
                  "click",
                  async () => { await CN_session.navigate_to(`${this.get_view_url()}/hold/add`); },
                );
                return btn_el;
              },
              is_constant: () => true,
            },
            trace: {
              title: "Trace",
              meta: true,
              set_postfix: () => {
                const btn_el = CN_element.create(
                  '<button type="button" class="btn btn-outline-primary ms-2">Change</button>'
                );
                btn_el.addEventListener(
                  "click",
                  async () => { await CN_session.navigate_to(`${this.get_view_url()}/trace/add`); },
                );
                return btn_el;
              },
              is_constant: () => true,
            },
            proxy: {
              title: "Proxy",
              meta: true,
              set_postfix: () => {
                const btn_el = CN_element.create(
                  '<button type="button" class="btn btn-outline-primary ms-2">Change</button>'
                );
                btn_el.addEventListener(
                  "click",
                  async () => { await CN_session.navigate_to(`${this.get_view_url()}/proxy/add`); },
                );
                return btn_el;
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
  get_scripts_url() {
    return [this.get_base_path("url"), "scripts", this.get_identifier()].join("/");
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
    const footer_el = super.create_footer_element();

    // add the scripts action
    const token_module = CN_session.get_module("token");
    if (token_module && token_module.action_allowed("add")) {
      const scripts_btn_el = CN_element.create(
        '<button name="scripts" type="button" class="btn btn-light btn-outline-primary">Scripts</button>'
      );
      scripts_btn_el.addEventListener("click", async () => {
        await CN_session.navigate_to(this.get_model().get_scripts_url());
      });
      footer_el.append(scripts_btn_el);
    }

    return footer_el;
  }
}

export class CN_participant_history extends CN_base_person_history {}

export class CN_participant_notes extends CN_base_person_notes {}

export class CN_participant_multiedit extends CN_base_action {
  #module_list = {
    participant: {
      availability_type_id: null,
      email: null,
      email2: null,
      gender_identity: null,
      global_note: null,
      honorific: null,
      mass_email: null,
      out_of_area: null,
      language_id: null,
      preferred_site_id: null,
      sex: null,
      pronouns: null,
    },
    consent: {
      consent_type_id: null,
      accept: null,
      written: null,
      datetime: null,
      note: null,
    },
    event: {
      event_type_id: null,
      datetime: null,
    },
    hold: {
      hold_type_id: null,
      datetime: null,
    },
    proxy: {
      proxy_type_id: null,
      datetime: null,
    },
  };

  /**
   * Constructor
   * @param base_model model: The model that the action belongs to
   */
  constructor(model) {
    super("multiedit", model);

    // store all module properties in this object
    for (var module_name in this.#module_list) {
      for (var prop_name in this.#module_list[module_name]) {
        this.#module_list[module_name][prop_name] = CN_session.get_module(module_name).get_property(prop_name);
      }
    }
  }

  /**
   * Extend parent method
   */
  async get_text(type) {
    if ("crumb" == type) {
      return "Participant Multi-Edit";
    }

    if ("header" == type) {
      return "Participant Multi-Edit";
    }

    return super.get_text(type);
  }

  /**
   * Extend parent method
   */
  async on_navigate_to_parent() {
    await CN_session.navigate_to("participant/list");
  }

  /**
   * Extend parent method
   */
  async on_load() {
  }

  /**
   * Extend parent method
   */
  update_element() {
  }

  /**
   * Extend parent method
   */
  create_placeholder_element() {
    return CN_element.create(`
      <div>
        <div class="text-info pb-2">
          In order to edit multiple participants at once you must first select which participants to edit.
          This can be done typing the unique identifiers (eg: A123456) of all participants you wish to have
          included in the operation, then confirm that list to ensure each of the identifiers can be linked
          to a participant.
        </div>
        <div class="text-info pb-2">
          Once you have confirmed the list of participant identifiers you may apply changes to all participants
          in the dialog box below.  Each tab allows you to make different types of changes to all selected
          participants.
        </div>
      </div>
        <div name="participant-list"></div>
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
          In order to edit multiple participants at once you must first select which participants to edit.
          This can be done typing the unique identifiers (eg: A123456) of all participants you wish to have
          included in the operation, then confirm that list to ensure each of the identifiers can be linked
          to a participant.
        </div>
        <div class="text-info pb-2">
          Once you have confirmed the list of participant identifiers you may apply changes to all participants
          in the dialog box below.  Each tab allows you to make different types of changes to all selected
          participants.
        </div>
        <div name="participant-list" class="py-1"></div>
        <div name="participant-edit" class="py-1">
          <ul class="nav nav-tabs" role="tablist"></ul>
          <div class="tab-content"></div>
        </div>
      </div>
    `);

    const participant_selection_el = create_participant_selection();
    body_el.querySelector("[name=participant-list]").append(participant_selection_el);

    const nav_el = body_el.querySelector("ul.nav-tabs");
    const tab_content_el = body_el.querySelector("div.tab-content");
    
    for (var module_name in this.#module_list) {
      nav_el.append(CN_element.create(`
        <li class="nav-item" role="presentation">
          <button
            class="nav-link ${"participant" == module_name ? "active" : ""}"
            id="${module_name}-tab"
            data-bs-toggle="tab"
            data-bs-target="#${module_name}-tab-pane"
            type="button"
            role="tab"
            aria-controls="${module_name}-tab-pane"
            aria-selected="${"participant" == module_name ? "true" : "false"}"
          >${CN_common.pretty_print("table", module_name)}</button>
        </li>
      `));

      const tab_pane_el = CN_element.create(`
        <div
          class="tab-pane fade border border-top-0 ${"participant" == module_name ? "show active" : ""}"
          id="${module_name}-tab-pane"
          role="tabpanel"
          aria-labelledby="${module_name}-tab"
          tabindex="0"
        >
          <div class="container-fluid p-3"></div>
        </div>
      `);

      const columns_el = tab_pane_el.querySelector("div.container-fluid");
      for (var prop_name in this.#module_list[module_name]) {
        columns_el.append(CN_element.create(`
          <div>${CN_common.pretty_print("column", prop_name)}</div>
        `));
      }

      tab_content_el.append(tab_pane_el);
    }

    return body_el;
  }

  /**
   * Extend parent method
   */
  create_footer_element() {
    const footer_el = CN_element.create(`
      <div class="btn-group" role="group">
        <button name="back" type="button" class="btn btn-primary">View Participant List</button>
      </div>
    `);

    footer_el.querySelector("button[name=back]").addEventListener(
      "click",
      async () => await this.on_navigate_to_parent()
    );

    return footer_el;
  }
}

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
    super("scripts", model);
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
    await Promise.all(this.#script_list.map(script => (async () => {
      script.token = null;
      script.end_datetime = null;
      try {
        const data = await CN_api.get(`script/${script.id}/pine_response/${this.get_model().get_identifier()}`);
        script.token = data.token;
        script.end_datetime = data.end_datetime;
      } catch (error) {
        // ignore 404
        if (404 != error.response.status) throw error;
      }
    })()));
  }

  /**
   * Extend parent method
   */
  update_element() {
    const script_list_el = this.get_body_element().querySelector("[name=script-list]");

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
              script.token = response.token;
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
        <div name="script-list">
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
        <div name="script-list"></div>
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
