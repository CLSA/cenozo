import { CN_action_upload } from "../action/upload.mjs"
import { CN_action_view } from "../action/view.mjs"
import { CN_base_model } from "./base_model.mjs"
import { CN_common } from "../common.mjs"
import { CN_session } from "../session.mjs"

export class CN_equipment_type_model extends CN_base_model {
  constructor() {
    super({
      wording: {
        singular: "equipment type",
        plural: "equipment types",
        posessive: "equipment type's",
      },
      columns: {
        name: { title: "Name" },
        equipment_count: { title: "Inventory", type: "number" },
        equipment_new_count: { title: "new", type: "number" },
        equipment_loaned_count: { title: "loaned", type: "number" },
        equipment_returned_count: { title: "returned", type: "number" },
        equipment_lost_count: { title: "lost", type: "number" },
        description: { title: "Description", align: "left" },
      },
      properties: {
        name: { title: "Name", format: "identifier" },
        regex: { title: "Format" },
        description: { title: "Description", type: "text" },
      },
    });
  }
}

export class CN_equipment_type_view extends CN_action_view {
  /**
   * Add extra operations to the footer
   */
  create_footer_element() {
    const footer_el = super.create_footer_element();
    const left_btn_group_el = footer_el.querySelector("div[name=left-btn-group]")

    if (this.get_model().get_module().action_allowed("upload")) {
      const upload_btn_el = this.constructor.html(`
        <button name="upload" type="button" class="btn btn-light btn-outline-primary">
          Import Equipment Data
        </button>
      `);
      upload_btn_el.addEventListener("click", async () => {
        await CN_session.navigate_to(`equipment_type/upload/${this.get_model().get_identifier()}`);
      });
      left_btn_group_el.append(upload_btn_el);
    }

    return footer_el;
  }
}

export class CN_equipment_type_upload extends CN_action_upload {
  /**
   * Replace parent method
   */
  upload_is_valid() {
    const summary_data = this.get_summary_data();
    return CN_common.is_object(summary_data) && 0 == summary_data.invalid.length && (
      0 < summary_data.equipment.new ||
      0 < summary_data.equipment.update ||
      0 < summary_data.loan.new ||
      0 < summary_data.loan.update
    );
  }

  /**
   * Extend parent method
   */
  update_element() {
    super.update_element();

    const summary_data = this.get_summary_data();
    if (CN_common.is_object(summary_data)) {
      const summary_card_el = this.get_body_element().querySelector("[name=summary] div.card-body");

      summary_card_el.append(this.constructor.html(`
        <div class="container">
          <span class="fs-5 fw-bold">Equipment Data:</span>
          ${summary_data.equipment.new} new, ${summary_data.equipment.update} existing
        </div>
      `));
      summary_card_el.append(this.constructor.html(`
        <div class="container">
          <span class="fs-5 fw-bold">Loan Data:</span>
          ${summary_data.loan.new} new, ${summary_data.loan.update} existing
        </div>
      `));

      if (0 < summary_data.invalid.length) {
        const invalid_el = this.constructor.html(`
          <div class="container">
            <div class="fs-5 fw-bold">Equipment Data:</div>
          </div>
        `);
        const ul_el = this.constructor.html('<ul class="text-danger"></ul>');
        summary_data.invalid.forEach(message => ul_el.append(this.constructor.html(`<li>${message}</li>`)));
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

    body_el.prepend(this.constructor.html(`
      <div class="container-fluid text-info-emphasis">
        <div class="pb-2">
          This utility allows you to upload equipment data from a CSV file.
        </div>
        <div class="pb-2">
          The file must have a single header row containing the column names listed in quotes below,
          and it must conform to one of the following options:
        </div>
        <div class="text-warning-emphasis pb-2">
          NOTE: You will not be able to upload data if there are any errors in the CSV data.
        </div>
        <div class="pb-2 px-3">
          <div class="fs-5">Option #1: Three rows (used to uploaod new equipment)</div>
          <ul>
            <li>Serial Number "serial_number" (must not belong to any other equipment type)</li>
            <li>Site Name "site" (may be blank)</li>
            <li>Equipment Note "note" (may be blank)</li>
          </ul>
          <div class="fs-5">Option #2: Eight rows (used to upload equipment that has alredy been loaned)</div>
          <ul>
            <li>Serial Number "serial_number" (must not belong to any other equipment type)</li>
            <li>Site Name "site" (may be blank)</li>
            <li>Equipment Note "note" (may be blank)</li>
            <li>UID "uid" (must be a pre-existing UID)</li>
            <li>Lost "lost" (considered lost if value is 1, y, yes or true)</li>
            <li>Start Date & Time in UTC "start_datetime" (YYYY-MM-DD hh:mm format)</li>
            <li>End Date & Time in UTC "end_datetime" (YYYY-MM-DD hh:mm format, may be blank)</li>
            <li>Loan Note "loan_note" (may be blank)</li>
          </ul>
        </div>
      </div>
    `));

    return body_el;
  }
}
