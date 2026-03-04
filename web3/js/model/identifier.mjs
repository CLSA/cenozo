import { CN_common } from "../common.mjs"
import { CN_session } from "../session.mjs"

import { CN_base_model } from "./base_model.mjs"
import { CN_base_element } from "../element/base_element.mjs"
import { CN_action_upload } from "../element/action/upload.mjs"
import { CN_action_view } from "../element/action/view.mjs"

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

export class CN_identifier_view extends CN_action_view {
  /**
   * Add extra operations to the footer
   */
  create_footer_element() {
    const footer_el = super.create_footer_element();

    if (this.get_model().get_module().action_allowed("upload")) {
      const upload_btn_el = CN_base_element.html(`
        <button name="upload" type="button" class="btn btn-light btn-outline-primary">
          Import Identifier Data
        </button>
      `);
      upload_btn_el.addEventListener("click", async () => {
        await CN_session.navigate_to(`identifier/upload/${this.get_model().get_identifier()}`);
      });
      footer_el.append(upload_btn_el);
    }

    return footer_el;
  }
}

export class CN_identifier_upload extends CN_action_upload {
  /**
   * Extend parent method
   */
  upload_is_valid() {
    const summary_data = this.get_summary_data();
    return CN_common.is_object(summary_data) && 0 < summary_data.valid_count && 0 == summary_data.error_count;
  }

  /**
   * Extend parent method
   */
  update_element() {
    super.update_element();

    const summary_data = this.get_summary_data();
    if (CN_common.is_object(summary_data)) {
      const summary_card_el = this.get_body_element().querySelector("[name=summary] div.card-body");

      summary_card_el.append(CN_base_element.html(`
        <div class="container">
          <div class="fs-5 fw-bold">Results</div>
          <ul>
            <li>Number of valid participant identifiers: ${summary_data.valid_count}</li>
            <li>Number of errors: ${summary_data.error_count}</li>
            <li>Number of warnings: ${summary_data.warning_count}</li>
          </ul>
        </div>
      `));

      if (0 < summary_data.error_list.length) {
        const invalid_el = CN_base_element.html(`
          <div class="container">
            <div class="fs-5 fw-bold">Errors</div>
          </div>
        `);
        const ul_el = CN_base_element.html('<ul class="text-danger"></ul>');
        summary_data.error_list.forEach(
          error => ul_el.append(CN_base_element.html(`<li>Line ${error.line}: ${error.message}</li>`))
        );
        invalid_el.append(ul_el);
        summary_card_el.append(invalid_el);
      }

      if (0 < summary_data.warning_list.length) {
        const invalid_el = CN_base_element.html(`
          <div class="container">
            <div class="fs-5 fw-bold">Warnings</div>
          </div>
        `);
        const ul_el = CN_base_element.html('<ul class="text-danger"></ul>');
        summary_data.warning_list.forEach(
          warning => ul_el.append(CN_base_element.html(`<li>Line ${warning.line}: ${warning.message}</li>`))
        );
        invalid_el.append(ul_el);
        summary_card_el.append(invalid_el);
      }
    }
  }

  /**
   * Extend parent method
   */
  create_body_element() {
    const body_el = super.create_body_element();

    body_el.prepend(CN_base_element.html(`
      <div class="container-fluid text-info-emphasis">
        <div class="pb-2">
          This utility allows you to upload participant identifier data from a CSV file.
        </div>
        <div class="pb-2">
          The file must only contain two values per row: the participant UID and the value of that participant's
          identifier (do not include a header row).
        </div>
        <div class="text-warning-emphasis pb-2">
          NOTE: You will not be able to upload data if there are any errors in the CSV data.
        </div>
      </div>
    `));

    return body_el;
  }
}
