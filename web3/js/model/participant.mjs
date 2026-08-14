import { CN_action_list } from "../action/list.mjs"
import { CN_action_notes } from "../action/notes.mjs"
import { CN_api } from "../api.mjs"
import { CN_base_action } from "../action/base_action.mjs"
import { CN_base_element } from "../element/base_element.mjs"
import {
  CN_model_base_person,
  CN_view_base_person,
  CN_history_base_person,
} from "./base_person.mjs"
import { CN_common } from "../common.mjs"
import { CN_element_card } from "../element/card.mjs"
import { CN_element_label } from "../element/label.mjs"
import { CN_input } from "../input/input.mjs"
import { CN_input_boolean } from "../input/boolean.mjs"
import { CN_input_enum } from "../input/enum.mjs"
import { CN_input_text } from "../input/text.mjs"
import { CN_modal_confirm } from "../modal/confirm.mjs"
import { CN_modal_message } from "../modal/message.mjs"
import { CN_script_launcher } from "../script_launcher.mjs"
import { CN_session } from "../session.mjs"

/**
 * @event selectionchanged: ran when the participant selection has changed
 */
export class CN_model_participant extends CN_model_base_person {
  constructor() {
    const columns = {
      uid: { title: "UID" },
      first_name: { title: "First Name" },
      last_name: { title: "Last Name" },
      cohort: { column: "cohort.name", title: "Cohort" },
      status: {
        title: "Status",
        table_prefix: false,
        is_hidden: () => this.get_parent_model() && "hold_type" == this.get_parent_model().get_name(),
      },
    };
    // only add the site column if this is a site-based application
    if (CN_session.get("application", "site_based")) {
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
        uid: { title: "Unique ID", is_constant: () => true },
        cohort: {
          column: "cohort.name",
          title: "Cohort",
          meta: { table: "cohort", column: "name" },
          is_constant: () => true,
        },
        status: { title: "Status", meta: {}, is_constant: () => true },
        global_note: { title: "Special Note", type: "text" },

        naming: {
          title: "Naming Details",
          properties: {
            honorific: {
              title: "Honorific",
              help: `
                <span class='fw-bold'>English examples:</span>
                Mr. Mrs. Miss Ms. Dr. Prof. Br. Sr. Fr. Rev. Pr.<br/>
                <span class='fw-bold'>Exemples français:</span>
                M. Mme Dr Dre Prof. F. Sr P. Révérend Pasteur Pasteure Me
              `,
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
              meta: {}, // predefined by the service
              is_constant: () => true,
              help: `
                Whether the participant has been enrolled into the study,
                and if not then the reason they have been excluded.
              `,
            },
            hold: {
              title: "Hold",
              meta: {}, // predefined by the service
              postfix: (el) => {
                if (this.allow_edit()) {
                  const btn_el = CN_base_element.html(
                    '<button type="button" class="btn btn-outline-primary ms-2">Change</button>'
                  );
                  btn_el.addEventListener(
                    "click",
                    async () => { await CN_session.navigate_to(`${this.get_view_url()}/hold/add`); },
                  );
                  el.append(btn_el);
                }
              },
              is_constant: () => true,
              help: "Whether the participant is currently in a hold.",
            },
            trace: {
              title: "Trace",
              meta: {}, // predefined by the service
              postfix: (el) => {
                if (this.allow_edit()) {
                  const btn_el = CN_base_element.html(
                    '<button type="button" class="btn btn-outline-primary ms-2">Change</button>'
                  );
                  btn_el.addEventListener(
                    "click",
                    async () => { await CN_session.navigate_to(`${this.get_view_url()}/trace/add`); },
                  );
                  el.append(btn_el);
                }
              },
              is_constant: () => true,
              help: "Whether the participant currently requires tracing.",
            },
            proxy: {
              title: "Proxy",
              meta: {}, // predefined by the service
              postfix: (el) => {
                if (this.allow_edit()) {
                  const btn_el = CN_base_element.html(
                    '<button type="button" class="btn btn-outline-primary ms-2">Change</button>'
                  );
                  btn_el.addEventListener(
                    "click",
                    async () => { await CN_session.navigate_to(`${this.get_view_url()}/proxy/add`); },
                  );
                  el.append(btn_el);
                }
              },
              is_constant: () => true,
              help: "Whether the participant requires a proxy, and if so then what their proxy status is.",
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
              type: "enum",
              is_constant: () => true,
            },
            gender_identity: { title: "Gender Identity", type: "enum" },
            pronouns: { title: "Pronouns" },
            date_of_birth: {
              title: "Date of Birth",
              type: "dob",
              get_max: () => CN_common.get_date(),
              get_dod: async () => this.get_action().get_property("date_of_death").form_input.get_date(),
              is_constant: () => 3 <= CN_session.get("role", "tier"),
            },
            date_of_death: {
              title: "Date of Death",
              type: "dod",
              get_min: () => this.get_action().get_property("date_of_birth").form_input.get_date(),
              get_max: () => CN_common.get_date(),
              get_dob: async () => this.get_action().get_property("date_of_birth").form_input.get_date(),
            },
            date_of_death_accuracy: {
              title: "Date of Death Accuracy",
              type: "enum",
              is_constant: () => "(empty)" == this.get_action().get_property_value("date_of_death"),
              help: "Defines how accurate the date of death is.",
            },
            date_of_death_ministry: {
              title: "Death Confirmed by Ministry",
              type: "boolean",
              is_constant: () => "(empty)" == this.get_action().get_property_value("date_of_death"),
              help: "Determines whether information about the participant's death is confirmed by a ministry.",
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
          title: (
            CN_session.get("application", "site_based") ?
            "Site & Contact Details" :
            "Contact Details"
          ),
          properties: {
            // only include site properties when the application is site-based
            ...(
              CN_session.get("application", "site_based") ?
              {
                id: { is_hidden: () => true },
                default_site: {
                  title: "Default Site",
                  meta: { table: "default_site", column: "name" },
                  is_constant: () => true,
                  is_hidden: () => !CN_session.get("application", "site_based"),
                  help: "The site the participant belongs to if a preferred site is not set.",
                },
                preferred_site_id: {
                  title: "Preferred Site",
                  meta: { table: "preferred_site", column: "id" },
                  type: "enum",
                  enum: { path: "site" },
                  is_hidden: () => !CN_session.get("application", "site_based"),
                  on_change: async (form_input, valid) => {
                    const action = form_input.get_action();
                    let proceed = true;
                    let access_to_participant_lost = false;

                    if (valid && !CN_session.get("role", "all_sites")) {
                      const participant_id = action.get_property_value_for_record("id");
                      const default_site = action.get_property_value_for_record("default_site");
                      const preferred_site_id = form_input.get_value();

                      // warn non all-sites users when changing the preferred site
                      if (
                        ("" === preferred_site_id && default_site != CN_session.get("site", "name")) ||
                        ("" !== preferred_site_id && preferred_site_id != CN_session.get("site", "id"))
                      ) {
                        const assignment = CN_session.get("user", "assignment");
                        access_to_participant_lost = (
                          !CN_common.is_object(assignment) ||
                          participant_id != assignment.participant_id
                        );
                        let message =
                          `Are you sure you wish to change this participant's preferred site?<br/><br/>` + (
                            access_to_participant_lost ?
                            "By selecting yes you will no longer have access to this participant." :
                            `
                              By selecting yes you will continue to have access to this participant until your
                              assignment is complete, after which you will no longer have access to this
                              participant.
                            `
                          );

                        proceed = await CN_modal_confirm.create_and_open({
                          title: "Change Preferred Site",
                          message: message,
                        });
                      }
                    }

                    if (proceed) {
                      // changing the preferred site can be slow, so always wait for the response
                      await CN_base_element.wait_for(
                        // note that on_property_change is extended in the view action to handle lost access
                        action.on_property_change("preferred_site_id", valid, access_to_participant_lost),
                        0
                      );
                    } else {
                      form_input.undo_value(true);
                    }
                  },
                  help: "If set then the participant will be assigned to this site instead of the default site.",
                },
              } :
              {}
            ),

            // these properties are always included
            ...{
              callback: { title: "Callback", type: "datetime", get_min: () => CN_common.get_date() },
              availability_type_id: {
                title: "Availability Preference",
                type: "enum",
                enum: { path: "availability_type" },
              },
              out_of_area: {
                title: "Out of Area",
                type: "boolean",
                help: "Whether the participant lives outside of the study's serviceable area.",
              },
              email: {
                title: "Email",
                type: "email",
                help: 'Must be in the format "account@domain.name".',
              },
              email2: {
                title: "Alternate Email",
                type: "email",
                help: 'Must be in the format "account@domain.name".',
              },
              mass_email: {
                title: "Mass Emails",
                type: "boolean",
                help: `
                  Whether the participant wishes to be included in mass emails such as newsletters,
                  holiday greetings, etc.
                `,
              },
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

  /**
   * Extend parent method
   */
  async clone_columns() {
    const columns = await super.clone_columns();

    const parent_model = this.get_parent_model();
    if (parent_model) {
      if ("consent_type" == parent_model.get_name()) {
        // Add accept and datetime columns when the parent model is consent_type
        columns.accept = { column: "consent.accept", title: "Accept", type: "boolean" };
        columns.datetime = { column: "consent.datetime", title: "Date & Time", type: "datetime" }
      } else if ("event_type" == parent_model.get_name()) {
        // Add datetime column when the parent model is event_type
        columns.datetime = { column: "event.datetime", title: "Date & Time", type: "datetime" }
      } else if ("hold_type" == parent_model.get_name()) {
        // Add datetime column when the parent model is hold_type
        columns.datetime = { column: "hold.datetime", title: "Date & Time", type: "datetime" }
      } else if ("proxy_type" == parent_model.get_name()) {
        // Add datetime column when the parent model is proxy_type
        columns.datetime = { column: "proxy.datetime", title: "Date & Time", type: "datetime" }
      }
    }

    return columns;
  }

  /**
   * Extend parent method
   */
  async clone_properties() {
    const properties = await super.clone_properties();

    // add the relation columns if enabled
    if (CN_session.get("application", "use_relation")) {
      properties["full_relation_type"] = {
        title: "Relationship Type",
        meta: {},
        is_constant: () => true,
      };
      properties["is_primary_relation"] = {
        meta: {},
        is_hidden: () => true, // used by the relation model to know when to allow adding relations
      };
    }

    return properties;
  }

  /**
   * Returns a typeahead object for models that have a typeahead property referencing this model
   * @return object
   * @static
   */
  static get_typeahead(params = {}) {
    return {
      get_list: async (value) => {
        const api_params = CN_common.merge_objects({
          select: {
            column: [{
              table: "participant",
              column: "id",
              alias: "key",
            }, {
              table: "participant",
              column: 'CONCAT( participant.first_name, " ", participant.last_name, " (", uid, ")" )',
              alias: "value",
              table_prefix: false,
            }],
          },
          modifier: {
            where: [
              { column: "uid", operator: "like", value: `%${value}%` },
              { column: "first_name", operator: "like", value: `%${value}%`, or: true },
              { column: "last_name", operator: "like", value: `%${value}%`, or: true },
            ],
            order: 'CONCAT( participant.first_name, " ", participant.last_name, " (", uid, ")" )',
            limit: 20,
          },
        }, params);
        return await CN_api.get("participant", api_params);
      },
    };
  }

  /**
   * Extend parent method
   */
  allow_edit() {
    return (
      super.allow_edit() &&
      !("view" == this.get_action_name() && "Yes" != this.get_action().get_property_value("exclusion"))
    );
  }
}

export class CN_list_participant extends CN_action_list {
  /**
   * Extends the parent method
   */
  _create_footer_element() {
    const footer_el = super._create_footer_element();

    if ("participant" == CN_session.get_leaf_model().get_name()) {
      const search_btn_el = this.constructor.html(
        '<button type="button" name="search" class="btn btn-light btn-outline-primary">Search</button>'
      );
      search_btn_el.addEventListener("click", () => {
        CN_session.navigate_to("search_result/list");
      });
      footer_el.querySelector("div.btn-group").append(search_btn_el);
    }

    return footer_el;
  }
}

export class CN_view_participant extends CN_view_base_person {
  #show_study_phase_status = false;

  /**
   * Extends the parent method
   */
  async get_text(type) {
    if ("crumb" == type) {
      return this.get_property_value("uid");
    }

    if ("header" == type) {
      const full_name = [
        this.get_property_value("honorific"),
        this.get_property_value("first_name"),
        this.get_property_value("last_name"),
      ].join(" ");
      return `Participant Details for ${full_name}`;
    }

    return await super.get_text(type);
  }

  /**
   * Extends the parent method
   */
  get_selector_child_list() {
    return super.get_selector_child_list()
      .filter(child => {
        // make participant identifier title more user friendly
        if ("participant_identifier" == child.model.get_name()) child.title = "Identifier";
        // only include the study phase status child if needed
        return this.#show_study_phase_status || "study_phase_status" != child.model.get_name();
      });
  }

  /**
   * Extends the parent method
   */
  async on_load() {
    // also update the study phase status ever time the action is loaded
    await Promise.all([super.on_load(), this.#update_show_study_phase_status()]);
  }

  /**
   * Extend the parent method
   */
  async on_property_change(prop_name, valid, lost_access = false) {
    if (valid && lost_access) {
      // We've lost access so set the property without re-running the action and navigate to the participant list
      await this.on_set_property(prop_name, false);
      await CN_session.navigate_to("participant/list");
    } else {
      await super.on_property_change(prop_name, valid);
    }
  }

  /**
   * Add operation to the footer element
   */
  _create_footer_element() {
    const footer_el = super._create_footer_element();
    const left_btn_group_el = footer_el.querySelector("div[name=left-btn-group]");

    // add the scripts action
    const token_module = CN_session.get_module("token");
    if (token_module && token_module.action_allowed("add")) {
      const scripts_btn_el = this.constructor.html(
        '<button name="scripts" type="button" class="btn btn-light btn-outline-primary">Scripts</button>'
      );
      scripts_btn_el.addEventListener("click", async () => {
        await CN_session.navigate_to(
          this.get_model().get_view_url().replace(/participant\/view/, "participant/scripts")
        )
      });
      left_btn_group_el.append(scripts_btn_el);
    }

    return footer_el;
  }

  async #update_show_study_phase_status() {
    let count = 0;
    try {
      count = await CN_api.count("study", {
        modifier: { where: { column: "enable_status", operator: "=", value: true } }
      });
    } catch (error) {
      // ignore 404s, it just means we don't have access to reading study data
      if (!CN_common.is_uri_error(error, 404)) throw error;
    }
    this.#show_study_phase_status = 0 < count;
  }
}

export class CN_history_participant extends CN_history_base_person {}

export class CN_notes_participant extends CN_action_notes {
  /**
   * Extend parent method
   */
  async get_text(type) {
    const model = this.get_model();

    if ("crumb" == type) {
      const uid = (await CN_api.get(model.get_view_url(null, "api"), { select: { column: "uid" } })).uid;
      return `${uid} Notes`;
    }

    if ("header" == type) {
      const data = await CN_api.get(
        model.get_view_url(null, "api"),
        { select: { column: ["first_name", "last_name", "uid"] } },
      );
      return (
        CN_common.uc_words(model.get_singular()) +
        ` Notes for ${data.first_name} ${data.last_name} (${data.uid})`
      );
    }

    return await super.get_text(type);
  }

  /**
   * Extend parent method
   */
  _create_topfooter_element() {
    const topfooter_el = super._create_topfooter_element();

    // wire-up the history button
    topfooter_el.querySelector("button[name=history]").addEventListener(
      "click",
      () => CN_session.navigate_to(this.get_model().get_history_url()),
    );

    return topfooter_el;
  }

  /**
   * Extend parent method
   */
  _create_footer_element() {
    const footer_el = super._create_footer_element();

    const history_btn_el = this.constructor.html(
      '<button name="history" type="button" class="btn btn-light btn-outline-primary">History</button>'
    );

    // wire-up the history button
    history_btn_el.addEventListener(
      "click",
      () => CN_session.navigate_to(this.get_model().get_history_url()),
    );
    footer_el.querySelector("div[name=left-btn-group]").append(history_btn_el);

    return footer_el;
  }
}

export class CN_multiedit_participant extends CN_base_action {
  #module_list = {
    participant: {
      module: null,
      proceed_btn_el: null,
      properties: {
        availability_type_id: null,
        email: null,
        email2: null,
        gender_identity: null,
        global_note: null,
        honorific: null,
        mass_email: null,
        out_of_area: "",
        language_id: null,
        preferred_site_id: null,
        sex: null,
        pronouns: null,
      },
    },
    collection: {
      module: null,
      proceed_btn_el: null,
      enum: {
        path: `application/${CN_session.get("application", "id")}/collection`,
        select: { column: ["name", { column: "locked", alias: "disabled" }] },
        modifier: {
          where: { column: "collection.active", operator: "=", value: true },
          order: "collection.name",
        },
      },
    },
    consent: {
      module: null,
      proceed_btn_el: null,
      properties: {
        consent_type_id: null,
        accept: null,
        written: null,
        datetime: null,
        note: null,
      },
    },
    event: {
      module: null,
      proceed_btn_el: null,
      properties: {
        event_type_id: null,
        datetime: null,
      },
    },
    hold: {
      module: null,
      proceed_btn_el: null,
      properties: {
        hold_type_id: null,
        datetime: null,
      },
    },
    note: {
      module: null,
      proceed_btn_el: null,
      // special so properties are not required
    },
    proxy: {
      module: null,
      proceed_btn_el: null,
      properties: {
        proxy_type_id: null,
        datetime: null,
      },
    },
    study: {
      module: null,
      proceed_btn_el: null,
      enum: { path: "study" },
    },
  };

  #participant_selection = new CN_element_participant_selection();
  #selected_participant_properties = {};

  constructor(parent_el, model) {
    super("multiedit", parent_el, model);
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
    await super.on_load();

    // reset the list and edit components
    this.#selected_participant_properties = {};
    await this.#participant_selection.reset();

    // make sure the module's classes have been loaded, then create a new model
    const promise_list = [];
    for (const module_name in this.#module_list) {
      const mod = this.#module_list[module_name];

      // don't load the module if it has already been loaded or for the note module
      if (mod.module || "note" == module_name) continue;

      promise_list.push((async () => {
        mod.module = CN_session.get_module(module_name);
        await mod.module.load_classes();
        const model = mod.module.create_model();

        if (mod.hasOwnProperty("properties")) {
          const properties = await model.clone_properties();

          // find each property (some may be in sub-groups) and populate any enum values
          for (const prop_name in mod.properties) {
            let prop = null;

            if (Object.keys(properties).includes(prop_name)) {
              prop = properties[prop_name];
            } else {
              // look in the sub-groups
              for (const p in properties) {
                if (properties[p].hasOwnProperty("properties")) {
                  if (Object.keys(properties[p].properties).includes(prop_name)) {
                    prop = properties[p].properties[prop_name];
                    break;
                  }
                }
              }
            }

            // if we didn't find the prop then ignore it
            if (null == prop) {
              delete mod.properties[prop_name];
            } else {
              mod.properties[prop_name] = prop;
            }
          }
        }
      })());
    }

    await Promise.all(promise_list);
  }

  /**
   * Extend parent method
   */
  update_element() {
    // do nothing if the modules haven't been loaded yet
    if (null == this.#module_list.participant.module) return;

    // implement the content in each tab
    for (const module_name in this.#module_list) {
      const mod = this.#module_list[module_name];
      const fields_el = this.get_body_element().querySelector(`#${module_name}-tab-pane div[name=fields]`);
      if ("participant" == module_name) {
        // get all input values
        const prev_params = Array.from(
          fields_el.querySelectorAll(".form-control, .form-select")
        ).reduce((obj, el) => {
          if (el.id) obj[el.id.replace(/^participant_/, "")] = 0 == el.value.length ? null : el.value;
          return obj;
        }, {});

        fields_el.innerHTML = "";

        // create a list of all selected participant properties
        const participant_properties = Object.keys(this.#selected_participant_properties).sort();
        participant_properties.forEach(prop_name => {
          const module_prop = this.#module_list.participant.module.get_property(prop_name);
          const prop = mod.properties[prop_name];
          const prop_id = `participant_${prop_name}`;
          const row_el = this.constructor.html('<div class="row mb-3"></div>');

          CN_element_label.append(row_el, { for: prop_id, value: prop.title, class: "col-sm-3" });

          // determine the property's UI element based on the type
          let params = CN_common.clone(prop);
          params.id = prop_id;
          params.action = this;
          params.class = "d-flex align-items-center col-sm-9";
          params.name = prop_name;
          if (!params.type) params.type = "string";
          if (undefined === params.required) params.required = module_prop ? module_prop.required : false;
          if (undefined === params.placeholder) params.placeholder = "(empty)";

          params.get_default = () => null;

          // restore any previous values
          if ("enum" != params.type && prev_params[prop_name]) params.value = prev_params[prop_name];

          if (undefined === params.max_length && module_prop && module_prop.max_length) {
            params.max_length = module_prop.max_length;
          }

          params.on_change = async () => {
            // validate all participant properties before we proceed
            let invalid = false;
            await Promise.all(
              Object.keys(this.#selected_participant_properties).map(property => (async () => {
                if (!(await this.#selected_participant_properties[property].validate())) invalid = true;
              })())
            );
            this.constructor.set_disabled(mod.proceed_btn_el, invalid);
          };

          params.postfix = (el) => {
            const btn_el = this.constructor.html(`
              <button name="remove" type="button" class="btn btn-danger ms-2">
                <i class="bi bi-x-circle-fill"></i>
              </button>
            `);
            btn_el.addEventListener(
              "click",
              async () => {
                delete this.#selected_participant_properties[prop_name];
                if (0 == Object.keys(this.#selected_participant_properties).length) {
                  this.constructor.set_disabled(mod.proceed_btn_el, true);
                }
                this.update_element();
              },
            );
            el.append(btn_el);
          };

          this.#selected_participant_properties[prop_name] = CN_input.create_input(params.type, row_el, params);
          row_el.append(this.#selected_participant_properties[prop_name].get_element());
          fields_el.append(row_el);
        });

        // create a way to select participant properties
        const select_el = this.constructor.html(
          '<select class="form-select mb-3" name="participant_column_select"></select>'
        );
        select_el.append(this.constructor.html('<option>Select which column to edit</option>'));
        for (const prop_name in mod.properties) {
          if (!participant_properties.includes(prop_name)) {
            const prop = mod.properties[prop_name];
            select_el.append(this.constructor.html(`<option value="${prop_name}">${prop.title}</option>`));
          }
        }
        select_el.addEventListener("change", () => {
          this.#selected_participant_properties[select_el.value] = null;
          select_el.value = undefined;
          this.update_element();
        });
        fields_el.append(select_el);
      } else {
        // only add non-participant properties to the UI once
        if (0 != fields_el.children.length) continue;

        if ("note" == module_name) {
          // add the sticky boolean
          let sticky_prop_id = `${module_name}_sticky`;
          const sticky_row_el = this.constructor.html('<div class="row mb-3"></div>');

          CN_element_label.append(sticky_row_el, {
            for: sticky_prop_id,
            value: "Sticky",
            class: "col-sm-3",
          });

          CN_input_boolean.append(sticky_row_el, {
            id: sticky_prop_id,
            action: this,
            required: true,
            name: "sticky",
            class: "col-sm-9",
            get_default: () => "false",
          });
          fields_el.append(sticky_row_el);

          // add the note text box
          let note_prop_id = `${module_name}_note`;
          const note_row_el = this.constructor.html('<div class="row mb-3"></div>');

          CN_element_label.append(note_row_el, {
            for: note_prop_id,
            value: "Note",
            class: "col-sm-3",
          });

          CN_input_text.append(note_row_el, {
            id: note_prop_id,
            action: this,
            required: true,
            name: "note",
            class: "col-sm-9",
            on_change: (form_input, valid) => {
              this.constructor.set_disabled(mod.proceed_btn_el, !valid);
            },
          });
          fields_el.append(note_row_el);
        } else if (mod.enum) {
          const pretty_module_name = CN_common.pretty_print("table", module_name);

          // add the opertion enum (add/remove)
          let op_prop_id = `${module_name}_operation`;
          const op_row_el = this.constructor.html('<div class="row mb-3"></div>');

          CN_element_label.append(op_row_el, {
            for: op_prop_id,
            value: "Operation",
            class: "col-sm-3",
          });

          CN_input_enum.append(op_row_el, {
            id: op_prop_id,
            action: this,
            required: true,
            name: "operation",
            get_default: () => "add",
            class: "d-flex align-items-center col-sm-9",
            enum: {
              values: [
                { key: "add", value: `Add to ${pretty_module_name}` },
                { key: "remove", value: `Remove from ${pretty_module_name}` },
              ],
            },
          });
          fields_el.append(op_row_el);

          // add the item enum
          let item_prop_id = `${module_name}_id`;
          const item_row_el = this.constructor.html('<div class="row mb-3"></div>');

          CN_element_label.append(item_row_el, {
            for: item_prop_id,
            value: pretty_module_name,
            class: "col-sm-3",
          });

          CN_input_enum.append(item_row_el, {
            id: item_prop_id,
            action: this,
            required: true,
            name: "item",
            class: "d-flex align-items-center col-sm-9",
            enum: mod.enum,
          });
          fields_el.append(item_row_el);
        } else if (mod.hasOwnProperty("properties")) {
          for (const prop_name in mod.properties) {
            const module_prop = mod.module.get_property(prop_name);
            const prop = mod.properties[prop_name];
            const prop_id = `${module_name}_${prop_name}`;
            const row_el = this.constructor.html('<div class="row mb-3"></div>');

            CN_element_label.append(row_el, {
              for: prop_id,
              value: prop.title,
              class: "col-sm-3",
            });

            // determine the property's UI element based on the type
            let params = CN_common.clone(prop);
            params.id = prop_id;
            params.action = this;
            params.class = "d-flex align-items-center col-sm-9";
            params.name = prop_name;
            params.get_default = () => module_prop.default;

            if (!params.type) params.type = "string";
            if (undefined === params.required) params.required = module_prop.required;
            if (undefined === params.placeholder) params.placeholder = "(empty)";

            if (undefined === params.max_length && module_prop.max_length) {
              params.max_length = module_prop.max_length;
            }

            const form_input = CN_input.create_input(params.type, row_el, params);
            row_el.append(form_input.get_element());
            fields_el.append(row_el);
          }
        }
      }
    }
  }

  /**
   * Extend parent method
   */
  _create_body_element() {
    const body_el = this.constructor.html(`
      <div class="container-fluid">
        <div class="container-fluid text-info-emphasis">
          In order to edit multiple participants at once you must first select which participants to edit.
          This can be done typing the unique identifiers (eg: A123456) of all participants you wish to have
          included in the operation, then confirm that list to ensure each of the identifiers can be linked
          to a participant.
        </div>
        <div class="container-fluid text-info-emphasis">
          Once you have confirmed the list of participant identifiers you may apply changes to all participants
          in the dialog box below.  Each tab allows you to make different types of changes to all selected
          participants.
        </div>
        <div name="participant-list" class="py-1"></div>
        <div name="participant-edit" class="py-1 d-none">
          <ul class="nav nav-tabs" role="tablist"></ul>
          <div class="tab-content"></div>
        </div>
      </div>
    `);

    this.#participant_selection.add_event_listener("selectionchanged", () => {
      const participant_edit_el = body_el.querySelector("[name=participant-edit]");
      if (this.#participant_selection.get_identifier_list().length) {
        participant_edit_el.classList.remove("d-none");
      } else {
        participant_edit_el.classList.add("d-none");
      }
    });

    const participant_list_el = body_el.querySelector("[name=participant-list]");
    this.#participant_selection.set_parent_element(participant_list_el);
    participant_list_el.append(this.#participant_selection.get_element());

    const nav_el = body_el.querySelector("ul.nav-tabs");
    const tab_content_el = body_el.querySelector("div.tab-content");

    for (const module_name in this.#module_list) {
      const mod = this.#module_list[module_name];
      const pretty_module_name = CN_common.pretty_print("table", module_name);

      nav_el.append(this.constructor.html(`
        <li class="nav-item" role="presentation">
          <button
            type="button"
            class="nav-link ${"participant" == module_name ? "active" : ""}"
            id="${module_name}-tab"
            data-bs-toggle="tab"
            data-bs-target="#${module_name}-tab-pane"
            type="button"
            role="tab"
            aria-controls="${module_name}-tab-pane"
            aria-selected="${"participant" == module_name ? "true" : "false"}"
          >${pretty_module_name}</button>
        </li>
      `));

      const tab_el = this.constructor.html(`
        <div
          class="tab-pane fade border border-top-0 pt-3 ${"participant" == module_name ? "show active" : ""}"
          id="${module_name}-tab-pane"
          role="tabpanel"
          aria-labelledby="${module_name}-tab"
          tabindex="0"
        >
          <div class="container-fluid text-info-emphasis">${
            "participant" == module_name ?
            "Select which details to edit for all selected participants:" :
            mod.enum ?
            `Select whether to add/remove all selected participants to/from the selected ${pretty_module_name}:` :
            `Select the ${pretty_module_name} details to be added to all selected participants:`
          }</div>
          <hr />
          <form>
            <fieldset>
              <div name="fields" class="container-fluid px-3"></div>
            </fieldset>
          </form>
          <div class="card-footer text-bg-secondary fs-5"></div>
        </div>
      `);

      mod.proceed_btn_el = this.constructor.html(`
        <button type="button" class="btn btn-primary" name="proceed">${
          "participant" == module_name ?
          "Change Details" :
          mod.enum ?
          `Change ${pretty_module_name}` :
          `Add ${pretty_module_name}`
        }</button>
      `);
      this.constructor.set_disabled(mod.proceed_btn_el, true);

      mod.proceed_btn_el.addEventListener("click", async () => {
        let response = null;
        await this.constructor.wait_for(async () => {
          const data = {
            identifier_id: this.#participant_selection.get_idtype(),
            identifier_list: this.#participant_selection.get_identifier_list(),
          }

          // build the data object posted to the server
          data["participant" == module_name ? "input_list" : module_name] = Array.from(
            tab_el.querySelectorAll(".form-control, .form-select")
          ).reduce((obj, el) => {
            if (el.id) {
              obj[el.id.replace(new RegExp(`^${module_name}_`), "")] = 0 == el.value.length ? null : el.value;
            }
            return obj;
          }, {});

          if ("participant" == module_name && 0 == Object.keys(data.input_list).length) {
            await CN_modal_message.create_and_open({
              header_class: "text-bg-danger",
              title: "No Columns Selected",
              message: "Please select at least one column to edit.",
            });
            return;
          }

          response = await CN_api.post("participant", data);
        });

        let message = `The ${pretty_module_name} record has been added to ${response} participant(s).`;
        if ("participant" == module_name) {
          message = `The listed details have been successfully updated in ${response} participant record(s).`;
        } else if (mod.enum) {
          const operation = tab_el.querySelector(`#${module_name}_operation`).value;
          const id = Number(tab_el.querySelector(`#${module_name}_id`).value);
          const name = mod.enum.values.find(option => id === option.id).name;
          message = `All selected participants have been ${
            "add" == operation ? "added to" : "removed from"
          } the "${name}" ${pretty_module_name}.`;
        }

        await CN_modal_message.create_and_open({
          title: (
            "participant" == module_name ?
            "Participant Details Updated" :
            mod.enum ?
            `${pretty_module_name} Updated` :
            `${pretty_module_name} Records Added`
          ),
          message: message,
        });
      });

      tab_el.querySelector("div.card-footer").append(mod.proceed_btn_el);
      tab_content_el.append(tab_el);
    }

    return body_el;
  }

  /**
   * Extend parent method
   */
  _create_footer_element() {
    const footer_el = this.constructor.html(`
      <div class="d-flex w-100">
        <div class="me-auto btn-group" role="group" name="right-btn-group"></div>
        <div class="btn-group" role="group" name="left-btn-group">
          <button name="back" type="button" class="btn btn-primary">View Participant List</button>
        </div>
      </div>
    `);
    footer_el.querySelector("button[name=back]").addEventListener("click", this.on_navigate_to_parent.bind(this));
    return footer_el;
  }
}

export class CN_scripts_participant extends CN_base_action {
  #participant;
  #script_list = [];
  #reverse_messages = {
    Proxy:
      "Are you sure you wish to reverse the participant's proxy status?<br/><br/>" +
      "By selecting yes you are confirming that the participant has decided to re-consider their proxy status.",
    Withdraw:
      "Are you sure you wish to reverse the participant's withdraw status?<br/><br/>" +
      "By selecting yes you are confirming that the participant has re-consented to participate in the study.",
  };

  constructor(parent_el, model) {
    super("scripts", parent_el, model);
  }

  /**
   * Extend parent method
   */
  async get_text(type) {
    if ("crumb" == type) {
      return `${this.#participant.uid} Scripts`;
    }

    if ("header" == type) {
      return `
        Utility scripts for
        ${this.#participant.first_name}
        ${this.#participant.last_name}
        (${this.#participant.uid})
      `;
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
    const identifier = this.get_model().get_identifier();

    await super.on_load();

    const [participant_response, script_response] = await Promise.all([
      CN_api.get(`participant/${identifier}`, {
        select: {
          column: [
            "uid",
            "first_name",
            "last_name",
            { table: "language", column: "code", alias: "lang" }
          ]
        }
      }),

      CN_api.get(`application/${CN_session.get("application", "id")}/script`, {
        select: { column: ["id", "name", "url"] },
        modifier: {
          where: { column: "supporting", operator: "=", value: true },
          order: "name",
        },
      }),
    ]);

    this.#participant = participant_response;
    this.#script_list = script_response;


    // initialize all scripts in parallel
    await Promise.all(this.#script_list.map(script => {
      script.launcher = new CN_script_launcher({
        script: script,
        identifier: this.get_model().get_identifier(),
        lang: this.#participant.lang,
      });
      return script.launcher.initialize();
    }));
  }

  /**
   * Extend parent method
   */
  update_element() {
    const script_list_el = this.get_body_element().querySelector("[name=script-list]");

    script_list_el.innerHTML = "";
    this.#script_list.forEach(script => {
      const reversable = this.#reverse_messages.hasOwnProperty(script.name);
      const token = script.launcher.get_token();
      const end_datetime = token ? token.end_datetime : null;
      const disabled = end_datetime && !reversable;
      let title = `Launch ${script.name}`;

      if (end_datetime) {
        title = (
          reversable ?
          `Reverse ${script.name} (completed on ${CN_common.format_datetime(end_datetime, "datetime")})` :
          `${script.name} Completed (${CN_common.format_datetime(end_datetime, "datetime")})`
        );
      }
      const btn_el = this.constructor.html(
        `<button type="button" class="btn btn-outline-primary w-100">${title}</button>`
      );
      this.constructor.set_disabled(btn_el, disabled);
      btn_el.addEventListener("click", async () => {
        if (end_datetime) {
          if (reversable) {
            const modal = new CN_modal_confirm({
              title: `Reverse ${script.name}`,
              message: this.#reverse_messages[script.name],
            });

            if (await modal.open()) {
              await this.constructor.wait_for(async () => {
                const params = {};
                params[`reverse_${script.name.replace(/ /, "_").toLowerCase()}`] = true;
                await CN_api.patch(`participant/${this.get_model().get_identifier()}`, params);
                await this.run();
              });
            }
          }
        } else {
          await script.launcher.open({
            show_hidden: 1,
            site: CN_session.get("site", "name"),
            username: CN_session.get("user", "name"),
          });

          // re-run the action once the user returns to this tab
          const regained_focus = async () => {
            await this.run();
            window.removeEventListener("focus", regained_focus);
          };
          window.addEventListener("focus", regained_focus);
        }
      });
      script_list_el.append(btn_el);
    });
  }

  /**
   * Extend parent method
   */
  _create_placeholder_element() {
    return this.constructor.html(`
      <div>
        <div class="text-info-emphasis pb-2">
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
  _create_body_element() {
    return this.constructor.html(`
      <div>
        <div class="text-info-emphasis pb-2">
          Select which utility script you wish to launch on behalf of the participant.
        </div>
        <div name="script-list"></div>
      </div>
    `);
  }

  /**
   * Extend parent method
   */
  _create_footer_element() {
    const footer_el = this.constructor.html(`
      <div class="d-flex w-100">
        <div class="me-auto btn-group" role="group" name="right-btn-group"></div>
        <div class="btn-group" role="group" name="left-btn-group">
          <button name="back" type="button" class="btn btn-primary">View Participant</button>
        </div>
      </div>
    `);
    footer_el.querySelector("button[name=back]").addEventListener("click", this.on_navigate_to_parent.bind(this));
    return footer_el;
  }
}

/**
 * A class used to create a participant selection element
 * @event selectionchanged: ran when the participant selection has changed
 */
export class CN_element_participant_selection extends CN_base_element {
  #created = false;
  #disabled = false;
  #validated = false;
  #count_el = null;
  #identifier_list_form_input;
  #idtype_list_form_input;
  #confirm_btn_el = null;
  #site_list = [];

  constructor(parent_el = null, config = {}) {
    super(parent_el, {
      ...{
        // default config
        path: "participant",
        data: {},
      },
      ...config,
    });
  }

  /**
   * Extend parent method
   */
  update_element() {
    super.update_element();

    if (this.#created) {
      this.#identifier_list_form_input.set_disabled(this.#disabled);
      this.#idtype_list_form_input.set_disabled(this.#disabled);

      // the confirm button is only enabled when the identifier list is not empty
      this.constructor.set_disabled(
        this.#confirm_btn_el,
        this.#disabled || null == this.#identifier_list_form_input.get_value()
      );
    }
  }

  /**
   * Extend parent method
   */
  _create_element() {
    const element = super._create_element();

    const identifier_list_id = (
      this.has_config("unique_id") ?
      `${this.get_config("unique_id")}-identifier_list` :
      "identifier_list"
    );

    const idtype_list_id = (
      this.has_config("unique_id") ?
      `${this.get_config("unique_id")}-idtype_list` :
      "idtype_list"
    );

    const card = CN_element_card.append(element, {
      header: this.constructor.html(`
        <div class="d-flex">
          <div class="flex-grow-1">Participant Selection</div>
          <div name="count" class="fw-normal">(unconfirmed)</div>
        </div>
      `),
      body: "",
      footer: this.constructor.html('<div class="row"></div>'),
    });
    this.#count_el = element.querySelector("div[name=count]");

    const card_body_el = card.get_element().querySelector(".card-body");
    this.#identifier_list_form_input = CN_input.create_input("text", card_body_el, {
      id: identifier_list_id,
      rows: 5,
      on_input: (form_input) => {
        this.#count_el.innerHTML = `(unconfirmed)`;
        this.update_element();

        if (this.#validated) {
          this.#validated = false;
          this.run_event_listeners("selectionchanged");
        }
      },
    });
    card_body_el.append(this.#identifier_list_form_input.get_element());

    element.querySelector("div.card-body").classList.add("p-0");

    // add the identifier-type list and confirm button
    this.#confirm_btn_el = this.constructor.html(
      '<button name="confirm" type="button" class="btn btn-primary ms-2">Confirm List</button>'
    );
    this.constructor.set_disabled(this.#confirm_btn_el, true);

    const row_el = element.querySelector("div.row");
    CN_element_label.append(row_el, {
      for: idtype_list_id,
      value: "Identifier",
      class: "col-sm-3",
    });
    this.#idtype_list_form_input = CN_input.create_input("enum", row_el, {
      id: idtype_list_id,
      class: "d-flex align-items-center col-sm-9",
      required: false,
      placeholder: "UID",
      on_change: () => this.reset_confirmation(),
      // add the confirm button as a postfix to the identifier-type selector
      postfix: (el) => el.append(this.#confirm_btn_el),
      enum: {
        get_enums: async (form_input) => {
          const list = await CN_api.get("identifier", {
            select: { column: ["id", "name", "regex"] },
            modifier: { order: "name" },
          });

          return list.map(idtype => ({ key: idtype.id, value: idtype.name, regex: idtype.regex }));
        },
      },
    });
    row_el.append(this.#idtype_list_form_input.get_element());

    // confirm the identifier list with the server
    this.#confirm_btn_el.addEventListener(
      "click",
      async () => {
        const idtype_id = this.get_idtype();

        // create the selected identifier-type's regex (if one exists)
        let re = null;
        if (idtype_id) {
          const regex = this.#idtype_list_form_input.get_config("enum").values.find(
            idtype => idtype_id === idtype.key
          ).regex;
          if (regex) re = new RegExp(regex);
        }

        const data = {
          ...this.get_config("data"),
          identifier_id: idtype_id,
          identifier_list: this.#identifier_list_form_input.get_value()
            .toUpperCase()
            // replace whitespace and separation chars with a space
            .replace(/[\s,;|\/]/g, " ")
            // remove extra space
            .replace(/ +/g, " ")
            // remove anything that isn't a letter, number, underscore or space
            .replace(/[^a-zA-Z0-9_ ]/g, "")
            // delimite string by spaces and create array from result
            .split(" ")
            // match the identifier-type's regex
            .filter(identifier => null == re || null != identifier.match(re))
            // make array unique
            .filter((identifier, index, array) => index <= array.indexOf(identifier))
            .sort(),
        };

        // disable until the operation is complete
        this.set_disabled(true);

        this.#validated = false;
        this.run_event_listeners("selectionchanged");

        // confirm with the server which identifiers are valid
        try {
          const response = await CN_api.post(this.get_config("path"), data);

          // note that the response may be an array or an object containing idtype_list and site_list props
          let identifier_list = [];
          this.#site_list = [];
          if (CN_common.is_object(response)) {
            identifier_list = response.identifier_list;
            this.#site_list = response.site_list;
          } else {
            identifier_list = response;
          }

          await this.#identifier_list_form_input.set_value(identifier_list.join(" "));
          this.#count_el.innerHTML = `(${identifier_list.length} selected)`;

          this.#validated = true;
          this.run_event_listeners("selectionchanged");
        } finally {
          this.set_disabled(false);
        }
      },
    );

    this.#created = true;
    this.reset();

    return element;
  }

  /**
   * Resets the confirmation of the selection back (does not remove the identifier list)
   */
  reset_confirmation() {
    this.#validated = false;
    this.run_event_listeners("selectionchanged");
    if (this.#created) this.#count_el.innerHTML = "(unconfirmed)";
  }

  /**
   * Resets the selection to its initial state
   */
  async reset() {
    this.reset_confirmation();
    if (this.#created) await this.#identifier_list_form_input.set_value(null);
    this.update_element();
  }

  /**
   * Returns whether the participant-selection's UI elements are disabled
   * @return boolean
   */
  get_disabled() {
    return this.#disabled;
  }

  /**
   * Sets whether to disable the participant-selection's UI elements
   * @param boolean disabled
   */
  set_disabled(disabled) {
    this.#disabled = disabled;
    this.update_element();
  }

  /**
   * Access methods
   */
  get_identifier_list() {
    const str = this.#identifier_list_form_input.get_value();
    return this.#validated && 0 < str.length ? str.split(" ") : [];
  }
  get_site_list() { return this.#site_list; }
  get_idtype() {
    const idtype = this.#idtype_list_form_input.get_value();
    return "" === idtype ? null : idtype;
  }
}
