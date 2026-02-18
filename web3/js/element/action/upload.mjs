import CN_api from "../../api.mjs"
import CN_common from "../../common.mjs"
import CN_session from "../../session.mjs"

import { CN_base_action } from "./base_action.mjs"
import { CN_element_card } from "../card.mjs"
import { CN_element_label } from "../label.mjs"
import { CN_input_file } from "../input/file.mjs"

export class CN_action_upload extends CN_base_action {
  #parent_record = null;
  #summary_data = null;

  /**
   * Constructor
   * @param base_model model: The model that the action belongs to
   */
  constructor(parent_el, model) {
    super("upload", parent_el, model);
  }

  // Access methods
  get_parent_record() { return this.#parent_record; }
  get_summary_data() { return this.#summary_data; }

  /**
   * Extends the parent method
   */
  async get_text(type) {
    const singular = this.get_model().get_singular();
    const name = (
      this.#parent_record.name ?
      this.#parent_record.name :
      this.#parent_record.title ?
      this.#parent_record.title :
      null
    );

    if ("crumb" == type) {
      return null == name ? "Import" : `${name} Import`;
    }

    if ("header" == type) {
      return null == name ? `Import ${singular} Data` : `Import ${name} ${singular} Data`;
    }

    if ("view_parent" == type) {
      return `View ${singular}`;
    }

    return await super.get_text(type);
  }

  /**
   * Must be implemented by child classes to determine whether the file is ready to be uploaded
   * @return boolean
   */
  upload_is_valid() {
    return false;
  }

  /**
   * Extends parent method
   */
  async on_load() {
    const model = this.get_model();

    // load the parent record details
    this.#parent_record = await CN_api.get(this.get_model().get_view_url(null, "api"));
  }

  /**
   * Extend parent method
   */
  update_element() {
    const summary_el = this.get_body_element().querySelector("[name=summary]");

    summary_el.innerHTML = "";

    if (CN_common.is_object(this.#summary_data)) {
      CN_element_card.create_element(summary_el, {
        header: "Upload Summary",
        body: "",
        footer: "",
      });

      if (this.upload_is_valid()) {
        // create the upload button to be used below
        const upload_btn_el = this.constructor.html(
          '<button name="upload" type="button" class="btn btn-primary ms-2">Upload Data</button>'
        );
        upload_btn_el.addEventListener("click", async () => {
          const file_el = this.get_body_element().querySelector("#file");
          await CN_api.patch(
            `${this.get_model().get_view_url(null, "api")}?import=apply`,
            await CN_common.convert_from_blob("text", file_el.files[0]),
            true // do not encode data
          );
          await CN_session.navigate_to(this.get_model().get_view_url());
        });

        summary_el.querySelector("div.card-footer").append(upload_btn_el);
      }
    }
  }

  /**
   * Extend parent method
   */
  create_body_element() {
    const body_el = this.constructor.html('<div></div>');

    // add the file input
    const row_el = this.constructor.html('<div class="row mx-1 pb-2"></div>');

    const label_el = CN_element_label.create_element(row_el, {
      for: "file",
      class: "col-sm-3",
      value: "CSV Data File"
    });

    const file_form_input = new CN_input_file(row_el, {
      id: "file",
      type: "file",
      class: "col-sm-9",
      file: { encoding: "text", mime_type: "text/csv" },
      on_change: async (form_input) => {
        this.#summary_data = await CN_api.patch(
          `${this.get_model().get_view_url(null, "api")}?import=check`,
          await CN_common.convert_from_blob("text", form_input.get_value()[0]),
          true // do not encode data
        );

        this.update_element();
      },
      required: true,
    });
    row_el.append(file_form_input.get_element());

    body_el.append(row_el);

    const summary_el = this.constructor.html('<div name="summary" class="container-fluid"></div>');
    body_el.append(summary_el);

    return body_el;
  }

  /**
   * Extend parent method
   */
  create_footer_element() {
    const footer_el = this.constructor.html(`
      <div class="btn-group" role="group">
        <button name="back" type="button" class="btn btn-primary">Back</button>
      </div>
    `);

    const back_btn_el = footer_el.querySelector("button[name=back]");
    (async () => { back_btn_el.innerHTML = await this.get_text("view_parent"); })();
    back_btn_el.addEventListener("click", this.on_navigate_to_parent.bind(this));

    return footer_el;
  }
}
