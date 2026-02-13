import CN_session from "../session.mjs"

import { CN_base_model } from "./base_model.mjs"
import { CN_base_element } from "../element/base_element.mjs"
import { CN_action_view } from "../element/action/view.mjs"

export class CN_report_type_model extends CN_base_model {
  constructor() {
    super({
      wording: {
        singular: "report type",
        plural: "report types",
        posessive: "report type's",
      },
      columns: {
        title: { title: "Title" },
        subject: { title: "Subject" },
        description: { title: "Description", align: "left" },
      },
      properties: {
        title: { title: "Title", format: "identifier" },
        subject: { title: "Subject" },
        description: { title: "Description", type: "text" },
      },
    });
  }
}

export class CN_report_type_view extends CN_action_view {
  /**
   * Add operation to footer element
   */
  create_footer_element() {
    const footer_el = super.create_footer_element();

    // add the download action
    const download_btn_el = CN_base_element.html(
      '<button name="run" type="button" class="btn btn-light btn-outline-primary">Run Report</button>'
    );
    download_btn_el.addEventListener(
      "click",
      async () => await CN_session.navigate_to(`${this.get_model().get_view_url()}/report/add`),
    );
    footer_el.append(download_btn_el);

    return footer_el;
  }
}
