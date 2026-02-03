import CN_api from "../../api.mjs"
import CN_common from "../../common.mjs"
import CN_element from "../../element.mjs"

import { CN_action_view } from "./view.mjs"

export class CN_action_report_view extends CN_action_view {
  #refresh_interval; // used to track the refresh interval (when waiting for report to complete)

  /**
   * Extends parent method
   */
  create_footer_element() {
    const footer_el = super.create_footer_element();

    // add the download button
    const download_btn_el = CN_element.create(
      '<button name="download" type="button" class="btn btn-light btn-outline-primary" disabled>Download</button>'
    );
    download_btn_el.addEventListener("click", async () => {
      const model = this.get_model();

      // determine the file's mime type based on the format property
      let mime_type = "text/csv";
      if ("report" == model.get_name()) {
        const format = this.get_property_value("format");
        if ("Excel" == format) {
          mime_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8"
        } else if ("" == format) {
          mime_type = "application/vnd.oasis.opendocument.spreadsheet;charset=utf-8";
        }
      }

      const response = await CN_api.file(`${model.get_name()}/${model.get_identifier()}`, mime_type, {}, true);
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
  async run(children = false) {
    await super.run(children);

    const card_header_el = this.get_element().querySelector(":scope > div > div.card > .card-header");
    const download_btn_el = this.get_footer_element().querySelector("button[name=download]");

    const stage = this.get_property_value("stage");
    if ("completed" == stage) {
      download_btn_el.removeAttribute("disabled");
    } else if (!["completed", "failed"].includes(stage)) {
      card_header_el.classList.add("bg-loading");

      // keep reloading the page until the report is either completed of failed
      let loading = false;
      this.#refresh_interval = setInterval(async () => {
        if (!loading) {
          loading = true;
          await super.run(children);

          const stage = this.get_property_value("stage");
          if (["completed", "failed"].includes(stage)) {
            if ("completed" == stage) {
              download_btn_el.removeAttribute("disabled");
            }
            card_header_el.classList.remove("bg-loading");
            clearInterval(this.#refresh_interval);
          }
          loading = false;
        }
      }, 3000);
    }
  }
}
