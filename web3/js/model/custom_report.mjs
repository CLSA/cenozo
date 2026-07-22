import { CN_action_list } from "../action/list.mjs"
import { CN_action_view } from "../action/view.mjs"
import { CN_api } from "../api.mjs"
import { CN_base_element } from "../element/base_element.mjs"
import { CN_base_model } from "./base_model.mjs"
import { CN_common } from "../common.mjs"
import { CN_session } from "../session.mjs"

export class CN_model_custom_report extends CN_base_model {
  constructor() {
    super({
      wording: {
        singular: "custom report",
        plural: "custom reports",
        posessive: "custom report's",
      },
      columns: {
        name: { title: "Name" },
        description: { title: "Description", type: "text", align: "left", limit: 500 },
      },
      properties: {
        name: { title: "Name", format: "identifier" },
        data: {
          title: "SQL Report",
          type: "file",
          file: {
            encoding: "base64",
            mime_type: "application/sql",
            get_filename: async () => this.get_action().get_property_value("name") + ".sql",
          },
        },
        description: { title: "Description", type: "text" },
      },
    });
  }

  async download_report(id) {
    await CN_base_element.wait_for(async () => {
      const response = await CN_api.file(`custom_report/${id}`, "text/csv", { file: "report" }, true);
      CN_common.download_file(
        await response.blob(),
        response.headers.get('content-disposition').match(/filename=(.*);/)[1],
      );
    });
  }
}

export class CN_list_custom_report extends CN_action_list {
  /**
   * Non-administrator roles download when clicking items in the list
   */
  async on_row_click(record) {
    if (3 <= CN_session.get("role", "tier") || this.is_choosing()) {
      await super.on_row_click(record);
    } else {
      await this.get_model().download_report(record.id);
    }
  }
}

export class CN_view_custom_report extends CN_action_view {
  /**
   * Add operation to footer element
   */
  _create_footer_element() {
    const footer_el = super._create_footer_element();
    const left_btn_group_el = footer_el.querySelector("div[name=left-btn-group]")

    // add the download action
    const download_btn_el = this.constructor.html(
      '<button name="download" type="button" class="btn btn-light btn-outline-primary">Run Report</button>'
    );
    download_btn_el.addEventListener(
      "click",
      this.get_model().download_report.bind(this, this.get_model().get_identifier()),
    );
    left_btn_group_el.append(download_btn_el);

    return footer_el;
  }
}
