import CN_api from "../api.mjs"
import CN_common from "../common.mjs"
import CN_element from "../element.mjs"
import CN_session from "../session.mjs"

import { CN_base_list } from "../base_list.mjs"
import { CN_base_model } from "../base_model.mjs"
import { CN_base_view } from "../base_view.mjs"

export class CN_custom_report_model extends CN_base_model {
  constructor() {
    super({
      wording: {
        singular: "custom report",
        plural: "custom reports",
        posessive: "custom report's",
      },
      columns: {
        name: { title: "Name" },
        description: { title: "Description", type: "text", align: "left" },
      },
      properties: {
        name: { title: "Name", format: "identifier" },
        data: {
          title: "SQL Report",
          type: "base64",
          mime_type: "application/sql",
          get_filename: async (action) => action.get_property("name").state.get() + ".sql",
        },
        description: { title: "Description", type: "text" },
      },
    });
  }

  async download_report(id) {
    await CN_element.wait_for(async () => {
      const response = await CN_api.file(`custom_report/${id}`, "text/csv", { file: "report" }, true);
      CN_common.download_file(
        await response.blob(),
        response.headers.get('content-disposition').match(/filename=(.*);/)[1],
      );
    });
  }
}

export class CN_custom_report_list extends CN_base_list {
  /**
   * Non-administrator roles download when clicking items in the list
   */
  async on_row_click(record) {
    if (3 <= CN_session.data.role.tier || this.is_choosing()) {
      await super.on_row_click(record);
    } else {
      await this.get_model().download_report(record.id);
    }
  }
}

export class CN_custom_report_view extends CN_base_view {
  /**
   * Add operation to footer element
   */
  create_footer_element() {
    const footer_el = super.create_footer_element();

    // add the download action
    const download_btn_el = CN_element.create(
      '<button name="download" type="button" class="btn btn-light btn-outline-primary">Download Report</button>'
    );
    download_btn_el.addEventListener(
      "click",
      async () => await this.get_model().download_report(this.get_model().get_identifier()),
    );
    footer_el.append(download_btn_el);

    return footer_el;
  }
}
