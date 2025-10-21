import CN_api from "../api.mjs"
import CN_common from "../common.mjs"
import CN_element from "../element.mjs"
import CN_session from "../session.mjs"

import { CN_base_action } from "../base_action.mjs"
import { CN_base_model } from "../base_model.mjs"
import { CN_base_view } from "../base_view.mjs"

export class CN_identifier_model extends CN_base_model {
  constructor() {
    super({
      wording: {
        singular: "identifier",
        plural: "identifiers",
        posessive: "identifier's",
      },
      columns: {
        name: { title: "Name" },
        locked: { title: "Locked", type: "boolean" },
        regex: { title: "Format" },
        description: { title: "Description", type: "text" },
      },
      properties: {
        name: { title: "Name", format: "identifier" },
        locked: {
          title: "Locked",
          type: "boolean",
          help: "If locked then participant identifiers cannot be added, changed or removed.",
        },
        regex: {
          title: "Format",
          help: "This is a regular expression used to make sure all identifiers follow a particular format.",
        },
        description: { title: "Description", type: "text" },
      }
    });
  }
}

export class CN_identifier_view extends CN_base_view {
  /**
   * Add extra operations to the footer
   */
  create_footer_element() {
    const footer_el = super.create_footer_element();

    if (this.get_model().get_module().action_allowed("upload")) {
      const upload_upload_btn_el = CN_element.create(`
        <button name="upload" type="button" class="btn btn-light btn-outline-primary">
          Import Identifier Data
        </button>
      `);
      upload_upload_btn_el.addEventListener("click", async () => {
        await CN_session.navigate_to(`identifier/upload/${this.get_model().get_identifier()}`);
      });
      footer_el.append(upload_upload_btn_el);
    }

    return footer_el;
  }
}

export class CN_identifier_upload extends CN_base_action {
  #identifier = null;

  /**
   * Constructor
   * @param base_model model: The model that the action belongs to
   */
  constructor(model) {
    super("upload", model);
  }

  /**
   * Extend parent method
   */
  async get_text(type) {
    if ("crumb" == type) {
      return `${this.#identifier.name} Import`;
    }

    if ("header" == type) {
      return `Import ${this.#identifier.name} Identifier Data`;
    }

    return super.get_text(type);
  }

  /**
   * Extend parent method
   */
  async on_navigate_to_parent() {
    await CN_session.navigate_to(this.get_model().get_view_url());
  }

  /**
   * Extend parent method
   */
  async on_load() {
    const model = this.get_model();

    // load the identifier details and site list
    this.#identifier = await CN_api.get(`identifier/${model.get_identifier()}`);
  }

  /**
   * Extend parent method
   */
  create_body_element() {
    const body_el = CN_element.create(`
      <div class="container-fluid">
        <div class="container-fluid text-info-emphasis">
          This utility allows you to upload participant identifier data from a CSV file.
        </div>
        <div class="container-fluid text-info-emphasis">
          The file must only contain two values per row: the participant UID and the value of that participant's
          identifier (do not include a header row).
        </div>
        <div class="container-fluid text-info-warning">
          NOTE: You will not be able to upload data if there are any errors in the CSV data.
        </div>
      </div>
    `);

    // add the file input
    const row_el = CN_element.create('<div class="row my-3"></div>');

    const label_el = CN_element.create_form_label({ for: "file", value: "CSV Data File" });
    label_el.classList.add("col-sm-3");
    row_el.append(label_el);

    const element_el = CN_element.create_form_element("file", {
      id: "file",
      type: "file",
      file: {
        encoding: "text",
        mime_type: "text/csv",
      },
      required: true,
    });
    element_el.classList.add("col-sm-9");
    row_el.append(element_el);

    body_el.append(row_el);

    const summary_el = CN_element.create('<div class="container-fluid"></div>');
    body_el.append(summary_el);

    // create the upload button to be used below
    const upload_btn_el = CN_element.create(
      '<button name="upload" type="button" class="btn btn-primary ms-2">Upload Data</button>'
    );
    upload_btn_el.addEventListener("click", async () => {
      await CN_api.patch(
        `identifier/${this.get_model().get_identifier()}?import=apply`,
        await CN_common.convert_from_blob("text", file_el.files[0]),
        true // do not encode data
      );

      await CN_session.navigate_to(this.get_model().get_view_url());
    });

    // display the summary whenever a CSV file is selected
    const file_el = element_el.querySelector("#file");
    file_el.addEventListener("change", async () => {
      const response = await CN_api.patch(
        `identifier/${this.get_model().get_identifier()}?import=check`,
        await CN_common.convert_from_blob("text", file_el.files[0]),
        true // do not encode data
      );

      summary_el.innerHTML = "";
      summary_el.append(CN_element.create_card({
        header: "CSV File Summary",
        body: "",
        footer: 0 < response.valid_count && 0 == response.error_count ?  upload_btn_el : null,
      }));

      const summary_card_el = summary_el.querySelector("div.card-body");
      summary_card_el.append(CN_element.create(`
        <div class="container">
          <div class="fs-5 fw-bold">Results</div>
          <ul>
            <li>Number of valid participant identifiers: ${response.valid_count}</li>
            <li>Number of errors: ${response.error_count}</li>
            <li>Number of warnings: ${response.warning_count}</li>
          </ul>
        </div>
      `));

      if (0 < response.error_list.length) {
        const invalid_el = CN_element.create(`
          <div class="container">
            <div class="fs-5 fw-bold">Errors</div>
          </div>
        `);
        const ul_el = CN_element.create('<ul class="text-danger"></ul>');
        response.error_list.forEach(
          error => ul_el.append(CN_element.create(`<li>Line ${error.line}: ${error.message}</li>`))
        );
        invalid_el.append(ul_el);
        summary_card_el.append(invalid_el);
      }

      if (0 < response.warning_list.length) {
        const invalid_el = CN_element.create(`
          <div class="container">
            <div class="fs-5 fw-bold">Warnings</div>
          </div>
        `);
        const ul_el = CN_element.create('<ul class="text-danger"></ul>');
        response.warning_list.forEach(
          warning => ul_el.append(CN_element.create(`<li>Line ${warning.line}: ${warning.message}</li>`))
        );
        invalid_el.append(ul_el);
        summary_card_el.append(invalid_el);
      }
    });

    return body_el;
  }

  /**
   * Extend parent method
   */
  create_footer_element() {
    const footer_el = CN_element.create(`
      <div class="btn-group" role="group">
        <button name="back" type="button" class="btn btn-primary">View Identifier</button>
      </div>
    `);

    footer_el.querySelector("button[name=back]").addEventListener(
      "click",
      async () => await this.on_navigate_to_parent()
    );

    return footer_el;
  }
}
