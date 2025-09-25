import CN_api from "../api.mjs"
import CN_common from "../common.mjs"
import CN_element from "../element.mjs"
import CN_session from "../session.mjs"

import { CN_base_add } from "../base_add.mjs"
import { CN_base_model } from "../base_model.mjs"
import { CN_base_view } from "../base_view.mjs"

export class CN_report_model extends CN_base_model {
  constructor() {
    super({
      wording: {
        singular: "report",
        plural: "reports",
        posessive: "report's",
      },
      columns: {
        report_type: { column: "report_type.name", title: "Report Type" },
        report_schedule: { title: "Automatic", type: "boolean", table_prefix: false },
        user: { column: "user.name", title: "User" },
        site: { column: "site.name", title: "Site" },
        role: { column: "role.name", title: "Role" },
        size: { title: "Size", type: "size" },
        stage: { title: "Status" },
        datetime: { title: "Date & Time", type: "datetime" },
      },
      properties: {
        report_schedule: {
          meta: true,
          title: "Automatically Generated",
          type: "boolean",
          is_hidden: (model) => "add" == model.get_action_name(),
          is_constant: () => true,
        },
        user: {
          meta: { table: "user", column: "name" },
          title: "User",
          is_hidden: (model) => "add" == model.get_action_name(),
          is_constant: () => true,
        },
        site: {
          meta: { table: "site", column: "name" },
          title: "Site",
          is_hidden: (model) => "add" == model.get_action_name(),
          is_constant: () => true,
        },
        role: {
          meta: { table: "role", column: "name" },
          title: "Role",
          is_hidden: (model) => "add" == model.get_action_name(),
          is_constant: () => true,
        },
        format: {
          title: "Format",
          type: "enum",
          is_constant: () => true,
        },
        stage: {
          title: "Status",
          is_hidden: (model) => "add" == model.get_action_name(),
          is_constant: () => true,
        },
        size: {
          title: "Size",
          type: "size",
          is_hidden: (model) => "add" == model.get_action_name(),
          is_constant: () => true,
        },
        datetime: {
          title: "Date & Time",
          type: "datetimesecond",
          is_hidden: (model) => "add" == model.get_action_name(),
          is_constant: () => true,
        },
        formatted_elapsed: {
          title: "Elapsed",
          meta: true,
          is_hidden: (model) => "add" == model.get_action_name(),
          is_constant: () => true,
        },
      },
    });
  }
}

// A private function used by both report_add and report_view
async function on_load(action) {
  const report_type_id = action.get_model().get_parent_model().get_identifier();
  if (report_type_id != action.current_report_type_id) {
    action.current_report_type_id = report_type_id;

    // re-define the report's restrictions
    const response = await CN_api.get(
      `report_type/${action.current_report_type_id}/report_restriction`,
      {
        select: { column: [
          "name",
          "title",
          "mandatory",
          "null_allowed",
          "restriction_type",
          "subject",
          "operator",
          "enum_list",
          "description",
        ] },
        modifier: { order: "rank" },
      },
    );

    if (0 < response.length) {
      action.add_property_group("restrictions", { title: "Report Parameters", open: true });
      response.forEach(prop => {
        // determine the parameters for each restriction type
        const params = {
          title: prop.title,
          meta: true,
          required: prop.mandatory,
          is_constant: () => "view" == action.get_type(),
        };
        if (["enum", "table"].includes(prop.restriction_type)) {
          params.type = "enum";
          params.enum = {
            get_enums: async () => {
              const enum_list = (
                "enum" == prop.restriction_type ?
                JSON.parse(`[${prop.enum_list}]`).map(item => ({ key: item, value: item, disabled: false })) :
                await CN_api.get(prop.subject, {
                  select: { column: [{ column: "id", alias: "key" }, { column: "name", alias: "value" }] },
                  modifier: { order: "name", limit: 1000000 },
                })
              );
              if (prop.null_allowed) {
                enum_list.unshift({
                  key: "_NULL_",
                  value: (
                    "table" == prop.restriction_type && "identifier" == prop.subject ?
                    "UID" :
                    (prop.mandatory ? "(empty)" : "(all)")
                  ),
                });
              }
              return enum_list;
            }
          };
        } else if ("identifier_list" == prop.restriction_type) {
          params.type = "string";
        } else {
          params.type = prop.restriction_type;
        }

        action.add_property("restrictions", `restrict_${prop.name}`, params);
      });
    }
  }
}

export class CN_report_add extends CN_base_add {
  current_report_type_id; // used in the custom on_load method

  /**
   * Extends parent method
   */
  async on_load() {
    await on_load(this);
    await super.on_load()
  }

  /**
   * Extends parent method
   */
  async on_post_submit(response) {
    await CN_session.navigate_to(this.get_model().get_view_url(response));
  }
}

export class CN_report_view extends CN_base_view {
  current_report_type_id; // used in the custom on_load method
  #refresh_interval; // used to track the refresh interval (when waiting for report to complete)

  /**
   * Extends parent method
   */
  create_footer_element() {
    const footer_el = super.create_footer_element();

    // add the download button
    const download_btn_el = CN_element.create(
      '<button name="download" type="button" class="btn btn-light btn-outline-primary">Download</button>'
    );
    download_btn_el.addEventListener("click", async () => {
      // determine the file's mime type based on the format property
      const format = this.get_property("format").state.get();
      let mime_type = "text/csv";
      if ("Excel" == format) {
        mime_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8"
      } else if ("" == format) {
        mime_type = "application/vnd.oasis.opendocument.spreadsheet;charset=utf-8";
      }

      const response = await CN_api.file(`report/${this.get_model().get_identifier()}`, mime_type, {}, true);
      CN_common.download_file(
        await response.blob(),
        response.headers.get('content-disposition').match(/filename=(.*);/)[1],
      );
    });
    footer_el.append(download_btn_el);

    return footer_el;
  }

  /**
   * remove the refresh_interval if the action is removed from the DOM
   */
  async on_dom_remove() {
    clearInterval(this.#refresh_interval);
  }

  /**
   * Extends parent method
   */
  async on_load() {
    await on_load(this);
    await super.on_load()

    if (!["completed", "failed"].includes(this.get_property("stage").state.get())) {
      // keep reloading the page until the report is either completed of failed
      let loading = false;
      this.#refresh_interval = setInterval(async () => {
        if (!loading) {
          if (["completed", "failed"].includes(this.get_property("stage").state.get())) {
            clearInterval(this.#refresh_interval);
          } else {
            loading = true;
            await super.on_load();
            loading = false;
          }
        }
      }, 3000);
    }
  }
}
