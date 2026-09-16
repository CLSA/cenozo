import { CN_api } from "../api.mjs"
import { CN_base_action } from "../action/base_action.mjs"
import { CN_common } from "../common.mjs"
import { CN_element_label } from "../element/label.mjs"
import { CN_input_enum } from "../input/enum.mjs"
import { CN_input } from "../input/input.mjs"
import { CN_session } from "../session.mjs"

export class CN_action_base_export extends CN_base_action {
  _add_table_form_input;
  _add_column_form_input;
  _add_subtype_form_input;

  #total_records = null;
  #record_list = [];
  #tables = {
    address: {
      column_enum_list: null,
      subtype_enum_list: [
        { key: "primary", value: "Primary" },
        { key: "first", value: "First" },
      ],
    },
    auxiliary: {
      column_enum_list: [
        { key: "has_alternate", value: "Has Alternate Contact", type: "boolean", ignore_subtype: true },
        { key: "has_decedent", value: "Has Decedent Responder", type: "boolean", ignore_subtype: true },
        { key: "has_emergency", value: "Has Emergency Contact", type: "boolean", ignore_subtype: true },
        { key: "has_informant", value: "Has IP", type: "boolean", ignore_subtype: true },
        { key: "has_informant_with_consent", value: "Has IP With Consent", type: "boolean", ignore_subtype: true },
        { key: "has_proxy", value: "Has DM", type: "boolean", ignore_subtype: true },
        { key: "has_proxy_with_consent", value: "Has DM With Consent", type: "boolean", ignore_subtype: true },
        { key: "is_in_collection", value: "In Collection", type: "boolean" },
      ],
      subtype_promise: CN_api.get("collection", {
        select: { column: "name" },
        modifier: { order: "name" },
      }),
    },
    collection: {
      subtype_promise: CN_api.get("collection", {
        select: { column: "name" },
        modifier: { order: "name" },
      }),
    },
    consent: {
      column_enum_list: null,
      subtype_promise: CN_api.get("consent_type", {
        select: { column: "name" },
        modifier: { order: "name" },
      }),
    },
    event: {
      column_enum_list: null,
      subtype_promise: CN_api.get("event_type", {
        select: { column: "name" },
        modifier: { order: "name" },
      }),
    },
    hin: { column_enum_list: null },
    hold: { column_enum_list: null },
    participant: { column_enum_list: null },
    participant_identifier: {
      column_enum_list: null,
      subtype_promise: CN_api.get("identifier", {
        select: { column: "name" },
        modifier: { order: "name" },
      }),
    },
    phone: { column_enum_list: null },
    proxy: { column_enum_list: null },
    site: {
      column_enum_list: null,
      subtype_enum_list: [
        { key: "effective", value: "Effective" },
        { key: "default", value: "Default" },
        { key: "preferred", value: "Preferred" },
      ],
    },
    stratum: {
      column_enum_list: null,
      subtype_promise: CN_api.get("stratum", {
        select: { column: "name" },
        modifier: { order: "name" },
      }),
    },
    study: {
      column_enum_list: null,
      subtype_promise: CN_api.get("study", {
        select: { column: "name" },
        modifier: { order: "name" },
      }),
    },
    trace: { column_enum_list: null },
  };

  constructor(parent_el, model) {
    super("list", parent_el, model);

    if (CN_session.get_module("interview")) {
      this.add_table("interview", {
        column_enum_list: null,
        subtype_promise: CN_api.get("qnaire", {
          select: { column: { column: 'CONCAT(rank, ". ", name)', alias: "value", table_prefix: false } },
          modifier: { order: "rank" },
        }),
      });
    }
  }

  get_total_records() { return this.#total_records; }
  get_record_list() { return this.#record_list; }
  get_table(name) { return this.#tables[name]; }

  /**
   * Adds a new table to the configuration (must be called in constructor)
   * @param string new_table
   * @param object config
   */
  add_table(new_table, config) {
    this.#tables[new_table] = config;
  }

  /**
   * Returns the formatted record count
   * @return string
   */
  get_formatted_record_count() {
    return `[${null === this.#total_records ? "..." : this.#total_records}]`;
  }

  /**
   * Extend parent method
   */
  async get_text(type) {
    const singular = CN_common.uc_words(this.get_model().get_singular());

    if ("header" == type) {
      return `${singular} List`;
    }

    if ("add" == type) {
      return `Add ${singular}`;
    }

    return await super.get_text(type);
  }

  /**
   * Extend parent method
   */
  set_disabled(disabled) {
    this.#record_list.forEach(record => {
      record.rank_form_input.set_disabled(disabled);
      if (record.subtype_form_input) record.subtype_form_input.set_disabled(disabled);
      this.constructor.set_disabled(record.delete_btn_el, disabled);
    });
  }

  /**
   * Override parent method
   */
  get_on_load_path() {
    return this.get_model().get_base_path("api");
  }

  /**
   * Override parent method
   */
  get_on_load_parameters() {
    return { modifier: { order: "rank" } };
  }

  /**
   * Override parent method
   */
  async on_load() {
    await super.on_load();

    const response_list = await Promise.all([
      CN_api.get(this.get_on_load_path(), this.get_on_load_parameters(), true),
      ...Object.keys(this.#tables).reduce((list, t) => {
        const table = this.#tables[t];
        if (table.hasOwnProperty("subtype_promise")) {
          list.push((async () => {
            // replace enum promise with an enum list
            const response = await Promise.resolve(table.subtype_promise);
            table.subtype_enum_list = (
              CN_common.is_array(response) ?
              response.map(subtype => {
                return {
                  key: subtype.id,
                  value: subtype.value ? subtype.value : subtype.name,
                };
              }) :
              []
            );
            delete table.subtype_promise;
          })());
        }
        return list;
      }, []),
    ]);

    const record_response = response_list[0];
    this.#total_records = Number(record_response.headers.get("X-Total"));
    this.#record_list = (await record_response.json()).map(record => ({ ...record, inputs: {} }));
  }

  /**
   * Extend parent method
   */
  update_element() {
    super.update_element();

    const model = this.get_model();
    const parent_model = model.get_parent_model();

    // update the parent's child list record count
    if (parent_model && "view" == parent_model.get_action_name()) {
      const child_lists_el = parent_model.get_element().querySelector("div[name=child-lists]");
      if (child_lists_el) {
        const btn_el = child_lists_el.querySelector(`button[name=${model.get_name()}]`);
        if (btn_el) {
          btn_el.innerHTML = btn_el.innerHTML.replace(/ \[[0-9.]+\].*/, ` ${this.get_formatted_record_count()}`);
        }
      }
    }
  }

  /**
   * Override parent method
   */
  _create_footer_element() {
    const relation_module = CN_session.get_module("relation");

    for (const table in this.#tables) {
      if (null === this.#tables[table].column_enum_list) {
        const module = CN_session.get_module(table)
        const property_name_list = module.get_property_names().filter(
          // exclude specific columns
          prop => !["address_id", "alternate_id", "participant_id", "preferred_site_id"].includes(prop)
        );
        if ("participant" == table) {
          if (relation_module) {
            // add the two relation columns
            property_name_list.push("index_participant");
            property_name_list.push("relation_type");
          }

          // add the status column
          property_name_list.push("status");
          property_name_list.sort();
        }

        this.#tables[table].column_enum_list = property_name_list.map(column => {
          const prop = module.get_property(column);
          const object = {
            key: column,
            value: "id" == column ? "Internal ID" : CN_common.format_variable_name(column).replace(/ ID$/, ""),
            type: (
              !prop ? "other" :
              "int" == prop.data_type ? (column.match(/_id$/) ? "enum" : "integer") :
              "tinyint" == prop.data_type ? "boolean" :
              ["text", "mediumtext", "char", "varchar"].includes(prop.data_type) ? "string" :
              ["datetime", "timestamp"].includes(prop.data_type) ? "datetime" :
              "date" == prop.data_type && "date_of_birth" == column ? "dob" :
              "date" == prop.data_type && "date_of_death" == column ? "dod" :
              prop.data_type // includes date, enum, float and time
            ),
          };

          if ("enum" == object.type) {
            if ("enum" == prop.data_type) {
              object.enum = { values: prop.enum_list };
            } else {
              const sub_table = column.replace(/^international_/, "").replace(/_id$/, "");
              object.enum = {
                get_enums: async () => {
                  const response = await CN_api.get(sub_table, {
                    select: { column: "name" },
                    modifier: { order: "name" },
                  });
                  return response.map(r => ({ key: r.id, value: r.name }));
                },
              };
            }
          }

          return object;
        });
      }
    }

    const footer_el = this.constructor.html('<div class="d-flex"></div>');

    CN_element_label.append(footer_el, {
      for: "add_table",
      value: "Table",
      class: "me-2 d-flex align-items-center fs-6",
    });
    this._add_table_form_input = CN_input_enum.append(footer_el, {
      id: "add_table",
      required: true,
      class: "flex-fill me-3",
      get_default: () => "participant",
      enum: {
        values: Object.keys(this.#tables)
          .sort()
          .filter(t => this.#tables[t].hasOwnProperty("column_enum_list"))
          .map(t => ({ key: t, value: CN_common.format_variable_name(t) })),
      },
      on_change: this.#update_add_form_inputs.bind(this, "table"),
    });

    CN_element_label.append(footer_el, {
      for: "add_column",
      value: "Column",
      class: "me-2 d-flex align-items-center fs-6",
    });
    this._add_column_form_input = CN_input_enum.append(footer_el, {
      id: "add_column",
      required: true,
      class: "flex-fill me-3",
      get_default: () => 'uid',
      enum: { values: this.#tables.participant.column_enum_list },
      on_change: this.#update_add_form_inputs.bind(this, "column"),
    });

    CN_element_label.append(footer_el, {
      for: "add_subtype",
      value: "Sub-Type",
      class: "me-2 d-flex align-items-center fs-6 d-none",
    });
    this._add_subtype_form_input = CN_input_enum.append(footer_el, {
      id: "add_subtype",
      required: true,
      class: "flex-fill me-3 d-none",
    });

    const add_btn_el = this.constructor.html('<button name="add" class="btn btn-primary"></button>');
    (async () => { add_btn_el.innerHTML = await this.get_text("add"); })();
    add_btn_el.addEventListener("click", this._add_record.bind(this));
    footer_el.append(add_btn_el);

    return footer_el;
  }

  /**
   * ADD DOCS
   */
  async _update_record(record, property) {
    const params = {};
    params[property] = record[`${property}_form_input`].get_value_for_record();

    this.set_disabled(true);
    await CN_api.patch(this.get_model().get_view_url(record.id, "api"), params);
    await this.run();
  }

  /**
   * ADD DOCS
   */
  async _delete_record(record) {
    this.set_disabled(true);
    await CN_api.delete(this.get_model().get_view_url(record.id, "api"));
    await this.run();
  }

  /**
   * ADD DOCS
   */
  async #update_add_form_inputs(input_name) {
    const footer_el = this.get_footer_element();
    const table = this.#tables[this._add_table_form_input.get_value()];

    // update the column enum when the table has changed
    if ("table" == input_name) {
      const column_enum = table.column_enum_list[0];
      this._add_column_form_input.set_config("enum", { values: table.column_enum_list });
      await this._add_column_form_input.update();
      await this._add_column_form_input.set_value(column_enum.key);
    }

    // update the subtype enum
    const column_value = this._add_column_form_input.get_value();
    const column = table.column_enum_list.find(c => c.key == column_value);
    if (table.hasOwnProperty("subtype_enum_list") && !column.ignore_subtype) {
      this._add_subtype_form_input.set_config("enum", { values: table.subtype_enum_list });
      await this._add_subtype_form_input.update();
      this._add_subtype_form_input.get_control_element().querySelector('option[value=""]').remove();
      await this._add_subtype_form_input.set_value(table.subtype_enum_list[0].key);
      footer_el.querySelector("label[for=add_subtype]").classList.remove("d-none");
      this._add_subtype_form_input.get_element().classList.remove("d-none");
    } else {
      this._add_subtype_form_input.set_config("enum", { values: [] });
      await this._add_subtype_form_input.update();
      await this._add_subtype_form_input.set_value(null);
      footer_el.querySelector("label[for=add_subtype]").classList.add("d-none");
      this._add_subtype_form_input.get_element().classList.add("d-none");
    }
  }
}
