import CN_api from "../api.mjs"
import CN_common from "../common.mjs"
import CN_element from "../element.mjs"
import CN_session from "../session.mjs"

import { CN_base_action } from "../base_action.mjs"
import { CN_base_model } from "../base_model.mjs"
import { CN_base_view } from "../base_view.mjs"

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

export class CN_equipment_type_view extends CN_base_view {
  /**
   * Add extra operations to the footer
   */
  create_footer_element() {
    const footer_el = super.create_footer_element();

    if (this.get_model().get_module().action_allowed("upload")) {
      const upload_upload_btn_el = CN_element.create(`
        <button name="upload" type="button" class="btn btn-light btn-outline-primary">
          Import Equipment Data
        </button>
      `);
      upload_upload_btn_el.addEventListener("click", async () => {
        await CN_session.navigate_to(`equipment_type/upload/${this.get_model().get_identifier()}`);
      });
      footer_el.append(upload_upload_btn_el);
    }

    return footer_el;
  }
}

export class CN_equipment_type_upload extends CN_base_action {
  #equipment_type = null;

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
      return `${this.#equipment_type.name} Import`;
    }

    if ("header" == type) {
      return `Import ${this.#equipment_type.name} Equipment Data`;
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

    // load the equipment_type details and site list
    this.#equipment_type = await CN_api.get(`equipment_type/${model.get_identifier()}`);
  }

  /**
   * Extend parent method
   */
  create_body_element() {
    const body_el = CN_element.create(`
      <div class="container-fluid">
        <div class="container-fluid text-info-emphasis">
          This utility allows you to upload equipment data from a CSV file.
        </div>
        <div class="container-fluid text-info-emphasis">
          The file must have a single header row containing the column names listed in quotes below,
          and it must conform to one of the following options:
        </div>
        <div class="container-fluid text-info-warning">
          NOTE: You will not be able to upload data if there are any errors in the CSV data.
        </div>
        <div class="container-fluid text-info-emphasis px-3">
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
        `equipment_type/${this.get_model().get_identifier()}?import=apply`,
        await CN_common.convert_from_blob("text", file_el.files[0]),
        true // do not encode data
      );

      await CN_session.navigate_to(this.get_model().get_view_url());
    });

    // display the summary whenever a CSV file is selected
    const file_el = element_el.querySelector("#file");
    file_el.addEventListener("change", async () => {
      const response = await CN_api.patch(
        `equipment_type/${this.get_model().get_identifier()}?import=check`,
        await CN_common.convert_from_blob("text", file_el.files[0]),
        true // do not encode data
      );

      summary_el.innerHTML = "";
      summary_el.append(CN_element.create_card({
        header: "CSV File Summary",
        body: "",
        footer: (
          0 == response.invalid.length && (
            0 < response.equipment.new ||
            0 < response.equipment.update ||
            0 < response.loan.new ||
            0 < response.loan.update
          ) ?
          upload_btn_el :
          null
        ),
      }));

      const summary_card_el = summary_el.querySelector("div.card-body");
      summary_card_el.append(CN_element.create(`
        <div class="container">
          <span class="fs-5 fw-bold">Equipment Data:</span>
          ${response.equipment.new} new, ${response.equipment.update} existing
        </div>
      `));
      summary_card_el.append(CN_element.create(`
        <div class="container">
          <span class="fs-5 fw-bold">Loan Data:</span>
          ${response.loan.new} new, ${response.loan.update} existing
        </div>
      `));

      if (0 < response.invalid.length) {
        const invalid_el = CN_element.create(`
          <div class="container">
            <div class="fs-5 fw-bold">Equipment Data:</div>
          </div>
        `);
        const ul_el = CN_element.create('<ul class="text-danger"></ul>');
        response.invalid.forEach(message => ul_el.append(CN_element.create(`<li>${message}</li>`)));
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
        <button name="back" type="button" class="btn btn-primary">View Equipment Type</button>
      </div>
    `);

    footer_el.querySelector("button[name=back]").addEventListener(
      "click",
      async () => await this.on_navigate_to_parent()
    );

    return footer_el;
  }
}
