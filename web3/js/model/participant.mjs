import CN_api from "../api.mjs"
import CN_common from "../common.mjs"
import CN_element from "../element.mjs"
import CN_session from "../session.mjs"

import { CN_base_action } from "../base_action.mjs"
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

export class CN_participant_view extends CN_base_view {
  /**
   * Extends the parent method
   */
  async get_text(type) {
    if ("name" == type) {
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

    // add the notes action
    const notes_btn_el = CN_element.create(
      '<button name="notes" type="button" class="btn btn-light btn-outline-primary">Notes</button>'
    );
    notes_btn_el.addEventListener("click", async () => {
      CN_session.navigate_to([model.get_base_path("url"), "notes", model.get_identifier()].join("/"));
    });
    footer_el.append(notes_btn_el);

    // add the history action
    const history_btn_el = CN_element.create(
      '<button name="history" type="button" class="btn btn-light btn-outline-primary">History</button>'
    );
    history_btn_el.addEventListener("click", async () => {
      CN_session.navigate_to([model.get_base_path("url"), "history", model.get_identifier()].join("/"));
    });
    footer_el.append(history_btn_el);

    // add the timezone action
    const timezone_btn_el = CN_element.create(
      '<button name="timezone" type="button" class="btn btn-light btn-outline-primary">Use Timezone</button>'
    );
    timezone_btn_el.addEventListener("click", async () => {
      await CN_session.set_timezone(
        { participant_id: model.get_identifier() },
        CN_session.data.user.am_pm,
      );
    });
    footer_el.append(timezone_btn_el);

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

export class CN_participant_history extends CN_base_action {
  #category_list = [];

  /**
   * ADD DOCS
   */
  constructor(model) {
    super("history", model);
    this.set_footer_at_top(true);

    this.#category_list = [{
      subject: "address",
      active: true,
      get_data: async () => {
        const response = await CN_api.get(`participant/${this.get_model().get_identifier()}/address`, {
          select: { column: [
            "create_timestamp",
            "rank",
            "address1",
            "address2",
            "city",
            "postcode",
            "international",
            { table: "region", column: "name", alias: "region" },
            { table: "country", column: "name", alias: "country" },
          ]},
        });
        return await response.json();
      },
    }, {
      subject: "alternate",
      active: true,
      get_data: async () => {
        const response = await CN_api.get(`participant/${this.get_model().get_identifier()}/alternate`, {
          select: { column: [
          ]},
        });
        return await response.json();
      },
    }, {
      subject: "consent",
      active: true,
      get_data: async () => {
        const response = await CN_api.get(`participant/${this.get_model().get_identifier()}/consent`, {
          select: { column: [
          ]},
        });
        return await response.json();
      },
    }, {
      subject: "event",
      active: true,
      get_data: async () => {
        const response = await CN_api.get(`participant/${this.get_model().get_identifier()}/event`, {
          select: { column: [
          ]},
        });
        return await response.json();
      },
    }, {
      subject: "form",
      active: true,
      get_data: async () => {
        const response = await CN_api.get(`participant/${this.get_model().get_identifier()}/form`, {
          select: { column: [
          ]},
        });
        return await response.json();
      },
    }, {
      subject: "hold",
      active: true,
      get_data: async () => {
        const response = await CN_api.get(`participant/${this.get_model().get_identifier()}/hold`, {
          select: { column: [
          ]},
        });
        return await response.json();
      },
    }, {
      subject: "mail",
      active: true,
      get_data: async () => {
        const response = await CN_api.get(`participant/${this.get_model().get_identifier()}/mail`, {
          select: { column: [
          ]},
        });
        return await response.json();
      },
    }, {
      subject: "note",
      active: true,
      get_data: async () => {
        const response = await CN_api.get(`participant/${this.get_model().get_identifier()}/note`, {
          select: { column: [
          ]},
        });
        return await response.json();
      },
    }, {
      subject: "phone",
      active: true,
      get_data: async () => {
        const response = await CN_api.get(`participant/${this.get_model().get_identifier()}/phone`, {
          select: { column: [
          ]},
        });
        return await response.json();
      },
    }, {
      subject: "proxy",
      active: true,
      get_data: async () => {
        const response = await CN_api.get(`participant/${this.get_model().get_identifier()}/proxy`, {
          select: { column: [
          ]},
        });
        return await response.json();
      },
    }, {
      subject: "trace",
      active: true,
      get_data: async () => {
        const response = await CN_api.get(`participant/${this.get_model().get_identifier()}/trace`, {
          select: { column: [
          ]},
        });
        return await response.json();
      },
    }];

    if(CN_session.get_module("assignment")) {
      this.#category_list.push({
        subject: "assignment",
        active: true,
        get_data: async () => {
          const response = await CN_api.get(`participant/${this.get_model().get_identifier()}/assignment`, {
            select: { column: [
            ]},
          });
          return await response.json();
        },
      });
    }

    if(CN_session.get_module("equipment")) {
      this.#category_list.push({
        subject: "equipment",
        active: true,
        get_data: async () => {
          const response = await CN_api.get(`participant/${this.get_model().get_identifier()}/equipment`, {
            select: { column: [
            ]},
          });
          return await response.json();
        },
      });
    }
  }

  /**
   * ADD DOCS
   */
  async get_text(type) {
    if ("header" == type) {
      return "Participant History";
    }
    return await super.get_text(type);
  }

  /**
   * ADD DOCS
   */
  async on_navigate_to_parent() {
    await CN_session.navigate_to(`participant/view/${this.get_model().get_identifier()}`);
  }

  /**
   * ADD DOCS
   */
  create_body_element() {
    const body_el = CN_element.create(`
      <div>
        <div name="button_list" class="container-fluid"></div>
        <hr></hr>
        <div name="history_list" class="container-fluid"></div>
      </div>
    `);

    // add the visibility toggles
    const button_list_el = body_el.querySelector("[name=button_list]");

    button_list_el.append(CN_element.create(`
      <div class="row">
        <button name="select_all" class="col btn btn-primary">Select All</button>
        <button name="select_none" class="col btn btn-primary">Select None</button>
      </div>
    `));

    const select_group_el = CN_element.create('<div name="select_group" class="row"></div>');
    button_list_el.append(select_group_el);

    this.#category_list.forEach(category => {
      select_group_el.append(CN_element.create(`
        <button name="${category.subject}" class="col btn btn-light btn-outline-primary">
          ${CN_common.uc_words(category.subject)}
        </button>
      `));
    });

    return body_el;
  }

  /**
   * ADD DOCS
   */
  create_all_footer_elements(el) {
    // wire up the buttons
    const back_btn_el = el.querySelector("button[name=back]");
    back_btn_el.addEventListener("click", async () => await this.on_navigate_to_parent());

    const notes_btn_el = el.querySelector("button[name=notes]");
    notes_btn_el.addEventListener(
      "click",
      async () => await CN_session.navigate_to(`participant/notes/${this.get_model().get_identifier()}`)
    );
  }

  /**
   * ADD DOCS
   */
  create_footer_element() {
    const footer_el = CN_element.create(`
      <div class="btn-group" role="group">
        <button name="back" type="button" class="btn btn-primary">View Participant</button>
        <button name="notes" type="button" class="btn btn-light btn-outline-primary">Notes</button>
      </div>
    `);
    this.create_all_footer_elements(footer_el);
    return footer_el;
  }

  /**
   * ADD DOCS
   */
  create_topfooter_element() {
    // no need to create the top-footer as it gets cloned from the footer
    const topfooter_el = super.create_topfooter_element();
    this.create_all_footer_elements(topfooter_el);
    return topfooter_el;
  }

}

export class CN_participant_notes extends CN_base_action {
  /**
   * ADD DOCS
   */
  constructor(model) {
    super("notes", model);
    this.set_footer_at_top(true);
  }

  /**
   * ADD DOCS
   */
  async get_text(type) {
    if ("header" == type) {
      return "Participant Notes";
    }
    return await super.get_text(type);
  }

  /**
   * ADD DOCS
   */
  async on_navigate_to_parent() {
    await CN_session.navigate_to(`participant/view/${this.get_model().get_identifier()}`);
  }

  /**
   * ADD DOCS
   */
  create_body_element() {
    const body_el = CN_element.create("<form><fieldset></fieldset></form>");



    return body_el;
  }

  /**
   * ADD DOCS
   */
  create_all_footer_elements(el) {
    // wire up the buttons
    const back_btn_el = el.querySelector("button[name=back]");
    back_btn_el.addEventListener("click", async () => await this.on_navigate_to_parent());

    const history_btn_el = el.querySelector("button[name=history]");
    history_btn_el.addEventListener(
      "click",
      async () => await CN_session.navigate_to(`participant/history/${this.get_model().get_identifier()}`)
    );
  }

  /**
   * ADD DOCS
   */
  create_footer_element() {
    const footer_el = CN_element.create(`
      <div class="btn-group" role="group">
        <button name="back" type="button" class="btn btn-primary">View Participant</button>
        <button name="history" type="button" class="btn btn-light btn-outline-primary">History</button>
      </div>
    `);
    this.create_all_footer_elements(footer_el);
    return footer_el;
  }

  /**
   * ADD DOCS
   */
  create_topfooter_element() {
    // no need to create the top-footer as it gets cloned from the footer
    const topfooter_el = super.create_topfooter_element();
    this.create_all_footer_elements(topfooter_el);
    return topfooter_el;
  }
}
