import CN_api from "../api.mjs"
import CN_common from "../common.mjs"
import CN_element from "../element.mjs"
import CN_session from "../session.mjs"

import { CN_base_model } from "../base_model.mjs"
import { CN_base_view } from "../base_view.mjs"

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
          typeahead: {
            get_list: async (value) => {
              return await CN_api.get("user", {
                select: {
                  column: [{
                    table: "user",
                    column: "id",
                    alias: "key",
                  }, {
                    table: "user",
                    column: 'CONCAT(user.first_name," ",user.last_name," (",user.name,")")',
                    alias: "value",
                    table_prefix: false,
                  }],
                },
                modifier: {
                  where: [
                    { column: "user.first_name", operator: "like", value: `%${value}%`, },
                    { column: "user.last_name", operator: "like", value: `%${value}%`, or: true },
                    { column: "user.name", operator: "like", value: `%${value}%`, or: true },
                  ],
                  order: 'CONCAT(user.first_name," ",user.last_name," (",user.name,")")',
                },
              });
            },
          },
          is_hidden: model => "add" == model.get_action_name(),
        },
        participant_count: {
          meta: false,
          title: "Participant Count",
          is_hidden: model => "add" == model.get_action_name(),
          is_constant: () => true,
          set_postfix: () => {
            const btn_el = CN_element.create(
              '<button type="button" class="btn btn-outline-primary ms-2">Calculate</button>'
            );
            btn_el.addEventListener(
              "click",
              async () => {
                const state = this.get_action().get_property("participant_count").state;
                state.set("(calculating...)");
                state.set(await CN_api.count(`${this.get_view_url(null, "api")}/participant`));
              },
            );
            return btn_el;
          },
        },
        description: { title: "Description", type: "text" },
      },
    });
  }

  /**
   * Converts a table name to a user-friendly string
   * @param string name
   * @return string
   */
  static table_filter(name) {
    return CN_common.is_string(name) ? CN_common.uc_words(name.replace(/_/g, " ")) : name;
  }

  /**
   * Converts a column name to a user-friendly string
   * @param string name
   * @return string
   */
  static column_filter(name) {
    return (
      CN_common.is_string(name) ?
      CN_common.uc_words(name.replace(/_/g, " ")).replace(/\b(Id|Uid)\b/, x => x.toUpperCase()) :
      name
    );
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
        filter: async (model, record) => this.table_filter(record.table_name),
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
        filter: async (model, record) => this.column_filter(record.column_name),
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
          value: this.table_filter(name),
        })) },
      },
      subtype: {
        title: "Sub-Type",
        type: "enum",
        enum: {
          get_enums: async (model) => {
            let enums = [];
            const table_name = model.get_action().get_property("table_name").state.get();
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
          const table_name = model.get_action().get_property("table_name").state.get();
          const table = this.get_export_table(table_name);
          return null == table;
        }
      },
      column_name: {
        title: "Column",
        type: "enum",
        enum: {
          get_enums: async (model) => {
            const table = model.get_action().get_property("table_name").state.get();
            return CN_session.get_module(table).get_property_names().sort().map( name => ({
              key: name,
              // convert the column name to a user-friendly string
              value: this.column_filter(name),
            }));
          },
        },
      },
    };
  }
}

export class CN_export_view extends CN_base_view {
  /**
   * Manually determine the participant count after loading the record
   */
  async on_load() {
    await super.on_load();

    // reset the partcipant count to unknown
    this.get_property("participant_count").state.set("(not calculated)");
  }

  /**
   * Add operations to the footer element
   */
  create_footer_element() {
    const footer_el = super.create_footer_element();

    // add the generate action
    const generate_btn_el = CN_element.create(
      '<button name="generate" type="button" class="btn btn-light btn-outline-primary">Generate</button>'
    );
    generate_btn_el.addEventListener("click", async () => {
      // create a new export_file then navigate to the returned ID
      const model = this.get_model();
      const response = await CN_api.post(`${model.get_view_url(null, "api")}/export_file`);
      await CN_session.navigate_to(`${model.get_view_url()}/export_file/view/${response}`);
    });
    footer_el.append(generate_btn_el);

    // add the duplicate action
    const duplicate_btn_el = CN_element.create(
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
    footer_el.append(duplicate_btn_el);

    return footer_el;
  }
}
