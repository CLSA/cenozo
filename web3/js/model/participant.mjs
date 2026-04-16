import { CN_action_notes } from "../element/action/notes.mjs"
import { CN_api } from "../api.mjs"
import { CN_base_action } from "../element/action/base_action.mjs"
import { CN_base_element } from "../element/base_element.mjs"
import {
  CN_base_person_model,
  CN_base_person_view,
  CN_base_person_history,
} from "./base_person_model.mjs"
import { CN_common } from "../common.mjs"
import { CN_element_card } from "../element/card.mjs"
import { CN_element_label } from "../element/label.mjs"
import { CN_input } from "../element/input/input.mjs"
import { CN_input_boolean } from "../element/input/boolean.mjs"
import { CN_input_enum } from "../element/input/enum.mjs"
import { CN_input_text } from "../element/input/text.mjs"
import { CN_modal_confirm } from "../element/modal/confirm.mjs"
import { CN_modal_message } from "../element/modal/message.mjs"
import { CN_session } from "../session.mjs"

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
        uid: { title: "UID", is_constant: () => true },
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
              meta: {}, // predefined by the service
              is_constant: () => true,
              help: "Whether the participant has been enrolled into the study, and if not then the reason they have been excluded.",
            },
            hold: {
              title: "Hold",
              meta: {}, // predefined by the service
              postfix: (el) => {
                const btn_el = CN_base_element.html(
                  '<button type="button" class="btn btn-outline-primary ms-2">Change</button>'
                );
                btn_el.addEventListener(
                  "click",
                  async () => { await CN_session.navigate_to(`${this.get_view_url()}/hold/add`); },
                );
                el.append(btn_el);
              },
              is_constant: () => true,
            },
            trace: {
              title: "Trace",
              meta: {}, // predefined by the service
              postfix: (el) => {
                const btn_el = CN_base_element.html(
                  '<button type="button" class="btn btn-outline-primary ms-2">Change</button>'
                );
                btn_el.addEventListener(
                  "click",
                  async () => { await CN_session.navigate_to(`${this.get_view_url()}/trace/add`); },
                );
                el.append(btn_el);
              },
              is_constant: () => true,
            },
            proxy: {
              title: "Proxy",
              meta: {}, // predefined by the service
              postfix: (el) => {
                const btn_el = CN_base_element.html(
                  '<button type="button" class="btn btn-outline-primary ms-2">Change</button>'
                );
                btn_el.addEventListener(
                  "click",
                  async () => { await CN_session.navigate_to(`${this.get_view_url()}/proxy/add`); },
                );
                el.append(btn_el);
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
              type: "enum",
              is_constant: () => true,
            },
            gender_identity: { title: "Gender Identity", type: "enum" },
            pronouns: { title: "Pronouns" },
            date_of_birth: {
              title: "Date of Birth",
              type: "dob",
              max: "now",
              is_constant: () => 3 <= CN_session.get("role", "tier"),
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
              is_constant: (model) => !model.get_action().get_property_value("date_of_death"),
              help: "Defines how accurate the date of death is.",
            },
            date_of_death_ministry: {
              title: "Death Confirmed by Ministry",
              type: "boolean",
              is_constant: (model) => !model.get_action().get_property_value("date_of_death"),
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

  /**
   * Extend parent method
   */
  clone_columns() {
    const columns = super.clone_columns();

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
  clone_properties() {
    const properties = super.clone_properties();

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
  static get_typeahead() {
    return {
      get_list: async (value) => {
        return await CN_api.get("participant", {
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
        });
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

export class CN_participant_view extends CN_base_person_view {
  /**
   * Extends the parent method
   */
  async get_text(type) {
    if (["crumb", "name"].includes(type)) {
      return this.get_property_value("uid");
    }
    return await super.get_text(type);
  }

  /**
   * Add operation to the footer element
   */
  create_footer_element() {
    const footer_el = super.create_footer_element();
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
}

export class CN_participant_history extends CN_base_person_history {}

export class CN_participant_notes extends CN_action_notes {
  /**
   * Extend parent method
   */
  async get_text(type) {
    const model = this.get_model();

    if ("crumb" == type) {
      return (
        await CN_api.get(
          model.get_view_url(null, "api"),
          { select: { column: "uid" } },
        )
      ).uid;
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
  create_topfooter_element() {
    const topfooter_el = super.create_topfooter_element();

    // wire-up the history button
    topfooter_el.querySelector("button[name=history]").addEventListener(
      "click",
      CN_session.navigate_to.bind(CN_session, this.get_model().get_history_url()),
    );

    return topfooter_el;
  }

  /**
   * Extend parent method
   */
  create_footer_element() {
    const footer_el = super.create_footer_element();

    const history_btn_el = this.constructor.html(
      '<button name="history" type="button" class="btn btn-light btn-outline-primary">History</button>'
    );

    // wire-up the history button
    history_btn_el.addEventListener(
      "click",
      CN_session.navigate_to.bind(CN_session, this.get_model().get_history_url()),
    );
    footer_el.querySelector("div[name=left-btn-group]").append(history_btn_el);

    return footer_el;
  }
}

export class CN_participant_multiedit extends CN_base_action {
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

  #participant_selection = new CN_participant_selection();
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
    // reset the list and edit components
    this.#selected_participant_properties = {};
    await this.#participant_selection.reset();

    // make sure the module's classes have been loaded, then create a new model
    const promise_list = [];
    for (const module_name in this.#module_list) {
      const mod = this.#module_list[module_name];

      // don't load the module if it has already been loaded or for the note module
      if (mod.moudle || "note" == module_name) continue;

      mod.module = CN_session.get_module(module_name);
      await mod.module.load_classes();
      const model = mod.module.create_model();

      if (mod.hasOwnProperty("properties")) {
        const properties = model.clone_properties();

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

          params.get_default = (model) => {
            return null;
          };

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
                const test = await this.#selected_participant_properties[property].validate();
                if (!test) invalid = true;
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
  create_body_element() {
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
        <button class="btn btn-primary" name="proceed">${
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
              title: "No Columns Selected",
              message: "Please select at least one column to edit.",
              type: "danger",
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
  create_footer_element() {
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

  constructor(parent_el, model) {
    super("scripts", parent_el, model);
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
    this.#script_list = await CN_api.get(`application/${CN_session.get("application", "id")}/script`, {
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
      const btn_el = this.constructor.html(
        `<button type="button" class="btn btn-outline-primary w-100">${title}</button>`
      );
      this.constructor.set_disabled(btn_el, disabled);
      btn_el.addEventListener("click", async () => {
        if (script.end_datetime) {
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
          // request a token if one doesn't already exist
          if (null == script.token) {
            await this.constructor.wait_for(async () => {
              const response = await CN_api.post(`script/${script.id}/pine_response`, {
                identifier: this.get_model().get_identifier(),
              })
              script.token = response.token;
            });
          }

          // if we still don't have a token then there's a problem
          if (null == script.token) {
            await CN_modal_message.create_and_open({
              title: "Respondent Not Found",
              message:
                "Unable to find the respondent record belonging to the script you are trying to launch. " +
                "If the problem persists please contact support.",
              type: "danger",
            });
          } else {
            // launch the sript
            const url_params = {
              show_hidden: 1,
              site: CN_session.get("site", "name"),
              username: CN_session.get("user", "name"),
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
  create_body_element() {
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
  create_footer_element() {
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
export class CN_participant_selection extends CN_base_element {
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

    this.#count_el = element.querySelector("div[name=count]");

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

          this.#identifier_list_form_input.set_value(identifier_list.join(" "));
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

    if (this.#created) {
      this.#identifier_list_form_input.set_value(null);
    }

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
