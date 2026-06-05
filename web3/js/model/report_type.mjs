import { CN_action_view } from "../action/view.mjs"
import { CN_base_model } from "./base_model.mjs"
import { CN_session } from "../session.mjs"

export class CN_model_report_type extends CN_base_model {
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

export class CN_view_report_type extends CN_action_view {
  async on_load() {
    await super.on_load();
    const leaf_model = CN_session.get_leaf_model();
    if ("report" == leaf_model.get_name()) {
      await leaf_model.create_restriction_inputs();
    }
  }

  /**
   * Add operation to footer element
   */
  _create_footer_element() {
    const footer_el = super._create_footer_element();
    const left_btn_group_el = footer_el.querySelector("div[name=left-btn-group]");

    // add the download action
    const download_btn_el = this.constructor.html(
      '<button name="run" type="button" class="btn btn-light btn-outline-primary">Run Report</button>'
    );
    download_btn_el.addEventListener(
      "click",
      async () => await CN_session.navigate_to(`${this.get_model().get_view_url()}/report/add`),
    );
    left_btn_group_el.append(download_btn_el);

    return footer_el;
  }
}
