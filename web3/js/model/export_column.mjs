import { CN_api } from "../api.mjs"
import { CN_base_action } from "../action/base_action.mjs"
import { CN_common } from "../common.mjs"
import { CN_element_label } from "../element/label.mjs"
import { CN_input_enum } from "../input/enum.mjs"
import { CN_input_rank } from "../input/rank.mjs"
import { CN_model_base_export_child } from "./base_export_child.mjs"
import { CN_session } from "../session.mjs"

export class CN_model_export_column extends CN_model_base_export_child {
  constructor() {
    super("column");
  }

  /**
   * Extend parent method
   */
  async clone_columns() {
    const columns = await super.clone_columns();
    columns.include = { title: "Visible", type: "boolean" };
    return columns;
  }

  /**
   * Extend parent method
   */
  async clone_properties() {
    const properties = await super.clone_properties();
    properties.include = { title: "Visible", type: "boolean" };
    return properties;
  }
}

export class CN_list_export_column extends CN_base_action {
  #add_table_form_input;
  #add_column_form_input;
  #add_subtype_form_input;

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
        { key: "has_alternate", value: "Has Alternate Contact" },
        { key: "has_decedent", value: "Has Decedent Responder" },
        { key: "has_emergency", value: "Has Emergency Contact" },
        { key: "has_informant", value: "Has Information Provider" },
        { key: "has_informant_with_consent", value: "Has Information Provider With Consent" },
        { key: "has_proxy", value: "Has Decision Maker" },
        { key: "has_proxy_with_consent", value: "Has Decision Maker With Consent" },
        { key: "is_in_collection", value: "In Collection" },
      ],
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
  }

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
    return "Columns";
  }

  /**
   * Extend parent method
   */
  set_disabled(disabled) {
    this.#record_list.forEach(record => {
      record.rank_form_input.set_disabled(disabled);
      if (record.subtype_form_input) record.subtype_form_input.set_disabled(disabled);
      this.constructor.set_disabled(record.include_btn_el, disabled);
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
                  value: subtype.value ? subtype.value : CN_common.format_variable_name(subtype.name),
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

    // add columns to the body
    const tbody_el = this.get_body_element().querySelector("tbody");
    tbody_el.innerHTML = "";
    this.#record_list.forEach(record => {
      const tr_el = this.constructor.html(`
        <tr id="export_column_${record.id}">
          <td name="rank" class="border border-light border-2 px-0 py-1 border-start-0"></td>
          <td name="table" class="border border-light border-2 px-3 py-1"></td>
          <td name="column" class="border border-light border-2 px-3 py-1"></td>
          <td name="subtype" class="border border-light border-2 px-0 py-1"></td>
          <td name="actions" class="border border-light border-2 px-0 py-1">
            <div class="btn-group" role="group"></div>
          </td>
        </tr>
      `);

      record.rank_form_input = CN_input_rank.append(tr_el.querySelector("td[name=rank]"), {
        name: "rank",
        required: true,
        max_rank: this.#record_list.length,
        get_default: () => record.rank,
        on_change: this.#update_record.bind(this, record, "rank"),
      });

      tr_el.querySelector("td[name=table]").innerHTML = CN_common.format_variable_name(record.table_name);
      tr_el.querySelector("td[name=column]").innerHTML = CN_common.format_variable_name(record.column_name);
      if (record.subtype) {
        record.subtype_form_input = CN_input_enum.append(tr_el.querySelector("td[name=subtype]"), {
          name: "subtype",
          required: true,
          enum: { values: this.#tables[record.table_name].subtype_enum_list },
          get_default: () => record.subtype,
          on_change: this.#update_record.bind(this, record, "subtype"),
        });
      }

      const actions_btn_group_el = tr_el.querySelector("td[name=actions] div.btn-group");
      record.include_btn_el = this.constructor.html(`
        <button name="include" class="btn btn-small btn-light btn-outline-primary">
          <i class="bi bi-eye${record.include ? "" : "-slash"}-fill"></i>
        </button>
      `);
      record.include_btn_el.addEventListener("click", this.#include_record.bind(this, record));
      actions_btn_group_el.append(record.include_btn_el);

      record.delete_btn_el = this.constructor.html(
        '<button name="delete" class="btn btn-small btn-danger"><i class="bi bi-x-circle-fill"></i></button>'
      );
      record.delete_btn_el.addEventListener("click", this.#delete_record.bind(this, record));
      actions_btn_group_el.append(record.delete_btn_el);

      tbody_el.append(tr_el);
    });

  }

  /**
   * Override parent method
   */
  _create_body_element() {
    return this.constructor.html(`
      <div>
        <div class="text-info-emphasis">
          Add columns to include in the participant export.<br>
          Some columns will require you to define a subtype.  This means that there are multiple records for one
          participant, so you must specify which record to include in the report.
        </div>
        <table class="table table-striped table-hover align-middle my-2">
          <thead>
            <tr>
              <th width="11%">Rank</th>
              <th width="28%">Table</th>
              <th width="28%">Column</th>
              <th width="28%">Sub-Type</th>
              <th width="5%"></th>
            </tr>
          </thead>
          <tbody class="table-group-divider">
          </tbody>
        </table>
      </div>
    `);
  }

  /**
   * Override parent method
   */
  _create_footer_element() {
    for (const table in this.#tables) {
      if (null === this.#tables[table].column_enum_list) {
        const property_name_list = CN_session.get_module(table).get_property_names();
        this.#tables[table].column_enum_list = property_name_list.map(prop => {
          return {
            key: prop,
            value: "id" == prop ? "Internal ID" : CN_common.format_variable_name(prop),
          };
        });
      }
    }

    const footer_el = this.constructor.html('<div class="d-flex"></div>');

    CN_element_label.append(footer_el, {
      for: "add_table",
      value: "Table",
      class: "me-2 d-flex align-items-center fs-6",
    });
    this.#add_table_form_input = CN_input_enum.append(footer_el, {
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
      on_change: async (form_input) => {
        const table = this.#tables[form_input.get_value()];

        // update the column enum
        this.#add_column_form_input.set_config("enum", { values: table.column_enum_list });
        await this.#add_column_form_input.update();
        this.#add_column_form_input.set_value(table.column_enum_list[0].key);

        // update the subtype enum
        if (table.hasOwnProperty("subtype_enum_list")) {
          this.#add_subtype_form_input.set_config("enum", { values: table.subtype_enum_list });
          await this.#add_subtype_form_input.update();
          this.#add_subtype_form_input.get_control_element().querySelector('option[value=""]').remove();
          this.#add_subtype_form_input.set_value(table.subtype_enum_list[0].key);
          footer_el.querySelector("label[for=add_subtype]").classList.remove("d-none");
          this.#add_subtype_form_input.get_element().classList.remove("d-none");
        } else {
          this.#add_subtype_form_input.set_config("enum", { values: [] });
          await this.#add_subtype_form_input.update();
          this.#add_subtype_form_input.set_value(null);
          footer_el.querySelector("label[for=add_subtype]").classList.add("d-none");
          this.#add_subtype_form_input.get_element().classList.add("d-none");
        }
      },
    });

    CN_element_label.append(footer_el, {
      for: "add_column",
      value: "Column",
      class: "me-2 d-flex align-items-center fs-6",
    });
    this.#add_column_form_input = CN_input_enum.append(footer_el, {
      id: "add_column",
      required: true,
      class: "flex-fill me-3",
      get_default: () => 'uid',
      enum: { values: this.#tables.participant.column_enum_list },
    });

    CN_element_label.append(footer_el, {
      for: "add_subtype",
      value: "Sub-Type",
      class: "me-2 d-flex align-items-center fs-6 d-none",
    });
    this.#add_subtype_form_input = CN_input_enum.append(footer_el, {
      id: "add_subtype",
      required: true,
      class: "flex-fill me-3 d-none",
    });

    const add_column_btn_el = this.constructor.html(
      '<button name="add" class="btn btn-primary">Add Column</button>'
    );
    add_column_btn_el.addEventListener("click", this.#add_record.bind(this));
    footer_el.append(add_column_btn_el);

    return footer_el;
  }

  /**
   * ADD DOCS
   */
  async #update_record(record, property) {
    const params = {};
    params[property] = record[`${property}_form_input`].get_value_for_record();

    this.set_disabled(true);
    await CN_api.patch(this.get_model().get_view_url(record.id, "api"), params);
    await this.run();
    this.set_disabled(false);
  }

  /**
   * ADD DOCS
   */
  async #include_record(record) {
    this.set_disabled(true);
    await CN_api.patch(this.get_model().get_view_url(record.id, "api"), { include: !record.include });
    await this.run();
    this.set_disabled(false);
  }

  /**
   * ADD DOCS
   */
  async #add_record() {
    this.set_disabled(true);
    await CN_api.post(this.get_model().get_base_path("api"), {
      table_name: this.#add_table_form_input.get_value(),
      column_name: this.#add_column_form_input.get_value(),
      subtype: this.#add_subtype_form_input.get_value(),
      rank: this.#record_list.length + 1,
    });
    await this.run();
    this.set_disabled(false);
  }

  /**
   * ADD DOCS
   */
  async #delete_record(record) {
    this.set_disabled(true);
    await CN_api.delete(this.get_model().get_view_url(record.id, "api"));
    await this.run();
    this.set_disabled(false);
  }
}
