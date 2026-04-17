import { CN_action_view } from "../action/view.mjs"
import { CN_api } from "../api.mjs"
import { CN_base_element } from "../element/base_element.mjs"
import { CN_base_model } from "./base_model.mjs"
import { CN_common } from "../common.mjs"
import { CN_session } from "../session.mjs"
import { CN_user_model } from "./user.mjs"

/**
 * An object of table lookups used by the export_column and export_restriction models
 */
const export_tables = {
  address: "",
  application: "application",
  auxiliary: "collection",
  consent: "consent_type",
  event: "event_type",
  hold: null,
  participant: null,
  participant_identifier: "identifier",
  phone: null,
  proxy: "proxy_type",
  site: "",
  stratum: "stratum",
  study: "study",
  trace: "trace_type",
};

export class CN_export_model extends CN_base_model {
  constructor() {
    super({
      wording: {
        singular: "export",
        plural: "exports",
        posessive: "export's",
      },
      columns: {
        title: { column: "export.title", title: "Title" },
        user: { column: "user.name", title: "Owner" },
        description: { column: "export.description", title: "Description", type: "text" },
      },
      properties: {
        title: { title: "Title", format: "identifier" },
        user_id: {
          title: "Owner",
          type: "typeahead",
          typeahead: CN_user_model.get_typeahead(),
          is_hidden: model => "add" == model.get_action_name(),
        },
        participant_count: {
          meta: null, // not associated with any column, set by the button in the postfix
          title: "Participant Count",
          is_hidden: model => "add" == model.get_action_name(),
          is_constant: () => true,
          postfix: (el) => {
            const btn_el = CN_base_element.html(
              '<button type="button" class="btn btn-outline-primary ms-2">Calculate</button>'
            );
            btn_el.addEventListener(
              "click",
              async () => {
                this.get_action().set_property_value("participant_count", "(calculating...)");
                CN_base_element.set_disabled(btn_el, true);
                this.get_action().set_property_value(
                  "participant_count",
                  await CN_api.count(`${this.get_view_url(null, "api")}/participant`)
                );
                CN_base_element.set_disabled(btn_el, false);
              },
            );
            el.append(btn_el);
          },
        },
        description: { title: "Description", type: "text" },
      },
    });
  }

  /**
   * Returns export table names
   * @return [string]
   */
  static get_export_table_names() {
    return Object.keys(export_tables);
  }

  /**
   * Returns the name of an export table
   * @param string name
   * @return string
   */
  static get_export_table(name) {
    return export_tables[name];
  }

  /**
   * An object of columns used by the export_column and export_restriction models
   */
  static get_export_columns() {
    return {
      table_name: {
        title: "Table",
        filter: async (model, record) => CN_common.pretty_print("table", record.table_name),
      },
      subtype: {
        title: "Sub-Type",
        filter: async (model, record) => {
          const table = this.get_export_table(record.table_name);
          const col = "application" == table ? "title" : "name";
          return (
            table && null != record.subtype ?
            (await CN_api.get(`${table}/${record.subtype}`, { select: { column: col } }))[col] :
            (null == record.subtype ? "N/A" : record.subtype)
          );
        },
      },
      column_name: {
        title: "Column",
        filter: async (model, record) => CN_common.pretty_print("column", record.column_name),
      },
    };
  }

  /**
   * An object of properties used by the export_column and export_restriction models
   */
  static get_export_properties() {
    return {
      table_name: {
        title: "Table",
        type: "enum",
        enum: { get_enums: (model) => this.get_export_table_names().map(name => ({
          key: name,
          value: CN_common.pretty_print("table", name),
        })) },
        on_change: async (form_input, valid) => {
          // run the default behaviour
          await form_input.get_action().on_property_change("table_name", valid);

          // re-run the action so the changed property is applied in the view and all child lists
          if (valid) form_input.get_action().run(true);
        }
      },
      subtype: {
        title: "Sub-Type",
        type: "enum",
        enum: {
          get_enums: async (model) => {
            let enums = [];
            const table_name = model.get_action().get_property_value("table_name");
            if ("site" == table_name) {
              enums = [
                { key: "default", value: "Default" },
                { key: "effective", value: "Effective" },
                { key: "preferred", value: "Preferred" },
              ];
            } else if ("address" == table_name) {
              enums = [
                { key: "first", value: "First" },
                { key: "primary", value: "Primary" },
              ];
            } else {
              const table = this.get_export_table(table_name);
              if (null != table) {
                const response = await CN_api.get(table, {
                  select: { column: ["id", "name"] },
                  modifier: { order: "name", limit: 1000000 },
                });

                enums = response.map(record => ({ key: record.id, value: record.name }));
              }
            }

            return enums;
          },
        },
        is_hidden: (model) => {
          const table_name = model.get_action().get_property_value("table_name");
          const table = this.get_export_table(table_name);
          return null == table;
        },
      },
      column_name: {
        title: "Column",
        type: "enum",
        enum: {
          get_enums: (model) => {
            const table = model.get_action().get_property_value("table_name");
            return (
              table ?
              CN_session.get_module(table).get_property_names().sort().map( name => ({
                key: name,
                // convert the column name to a user-friendly string
                value: CN_common.pretty_print("column", name),
              })) :
              []
            );
          },
        },
      },
    };
  }
}

export class CN_export_view extends CN_action_view {
  /**
   * Manually determine the participant count after loading the record
   */
  async on_load() {
    await super.on_load();

    // reset the partcipant count to unknown
    this.set_property_value("participant_count", "(not calculated)");
  }

  /**
   * Add operations to the footer element
   */
  create_footer_element() {
    const footer_el = super.create_footer_element();
    const left_btn_group_el = footer_el.querySelector("div[name=left-btn-group]")

    // add the generate action
    const generate_btn_el = this.constructor.html(
      '<button name="generate" type="button" class="btn btn-light btn-outline-primary">Generate</button>'
    );
    generate_btn_el.addEventListener("click", async () => {
      // create a new export_file then navigate to the returned ID
      const model = this.get_model();
      const response = await CN_api.post(`${model.get_view_url(null, "api")}/export_file`);
      await CN_session.navigate_to(`${model.get_view_url()}/export_file/view/${response}`);
    });
    left_btn_group_el.append(generate_btn_el);

    // add the duplicate action
    const duplicate_btn_el = this.constructor.html(
      '<button name="duplicate" type="button" class="btn btn-light btn-outline-primary">Duplicate</button>'
    );
    duplicate_btn_el.addEventListener("click", async () => {
      // duplicate the export on the server side then navigate to the returned ID
      const model = this.get_model();
      const response = await CN_api.post(
        `${model.get_base_path("api")}?duplicate_export_id=${model.get_identifier()}`
      );
      await CN_session.navigate_to(model.get_view_url(response));
    });
    left_btn_group_el.append(duplicate_btn_el);

    return footer_el;
  }
}
