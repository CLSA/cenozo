import { CN_action_base_export } from "../action/base_export.mjs"
import { CN_api } from "../api.mjs"
import { CN_common } from "../common.mjs"
import { CN_input_enum } from "../input/enum.mjs"
import { CN_input_rank } from "../input/rank.mjs"
import { CN_base_model } from "./base_model.mjs"

export class CN_model_export_column extends CN_base_model {
  constructor() {
    super({
      wording: {
        singular: "column",
        plural: "columns",
        posessive: "column's",
      },
    });
  }
}

export class CN_list_export_column extends CN_action_base_export {
  /**
   * Extend parent method
   */
  set_disabled(disabled) {
    super.set_disabled(disabled);
    this.get_record_list().forEach(record => {
      this.constructor.set_disabled(record.include_btn_el, disabled);
    });
  }

  /**
   * Extend parent method
   */
  update_element() {
    super.update_element();

    // add columns to the body
    const tbody_el = this.get_body_element().querySelector("tbody");
    tbody_el.innerHTML = "";
    this.get_record_list().forEach(record => {
      const tr_el = this.constructor.html(`
        <tr id="export_column_${record.id}">
          <td name="rank" class="border border-light border-2 px-0 py-1 border-start-0"></td>
          <td name="table" class="border border-light border-2 px-3 py-1"></td>
          <td name="column" class="border border-light border-2 px-3 py-1"></td>
          <td name="subtype" class="border border-light border-2 px-0 py-1"></td>
          <td name="actions" class="border border-light border-2 px-0 py-1">
            <div class="btn-group" role="group"></div>
          </td>
        </tr>
      `);

      record.rank_form_input = CN_input_rank.append(tr_el.querySelector("td[name=rank]"), {
        name: "rank",
        required: true,
        max_rank: this.get_total_records(),
        get_default: () => record.rank,
        on_change: this._update_record.bind(this, record, "rank"),
      });

      tr_el.querySelector("td[name=table]").innerHTML = CN_common.format_variable_name(record.table_name);
      tr_el.querySelector("td[name=column]").innerHTML =
        CN_common.format_variable_name(record.column_name).replace(/ ID$/, "");
      if (record.subtype) {
        record.subtype_form_input = CN_input_enum.append(tr_el.querySelector("td[name=subtype]"), {
          name: "subtype",
          required: true,
          enum: { values: this.get_table(record.table_name).subtype_enum_list },
          get_default: () => record.subtype,
          on_change: this._update_record.bind(this, record, "subtype"),
        });
      }

      const actions_btn_group_el = tr_el.querySelector("td[name=actions] div.btn-group");
      record.include_btn_el = this.constructor.html(`
        <button name="include" class="btn btn-small btn-light btn-outline-primary">
          <i class="bi bi-eye${record.include ? "" : "-slash"}-fill"></i>
        </button>
      `);
      record.include_btn_el.addEventListener("click", this._include_record.bind(this, record));
      actions_btn_group_el.append(record.include_btn_el);

      record.delete_btn_el = this.constructor.html(
        '<button name="delete" class="btn btn-small btn-danger"><i class="bi bi-x-circle-fill"></i></button>'
      );
      record.delete_btn_el.addEventListener("click", this._delete_record.bind(this, record));
      actions_btn_group_el.append(record.delete_btn_el);

      tbody_el.append(tr_el);
    });

  }

  /**
   * Override parent method
   */
  _create_body_element() {
    return this.constructor.html(`
      <div>
        <div class="text-info-emphasis">
          Add columns to include in the participant export.<br>
          Some columns will require you to define a subtype.  This means that there are multiple records for one
          participant, so you must specify which record to include in the report.
        </div>
        <table class="table table-striped table-hover align-middle my-2">
          <thead>
            <tr>
              <th width="11%">Rank</th>
              <th width="28%">Table</th>
              <th width="28%">Column</th>
              <th width="28%">Sub-Type</th>
              <th width="5%"></th>
            </tr>
          </thead>
          <tbody class="table-group-divider">
          </tbody>
        </table>
      </div>
    `);
  }

  /**
   * ADD DOCS
   */
  async _include_record(record) {
    this.set_disabled(true);
    await CN_api.patch(this.get_model().get_view_url(record.id, "api"), { include: !record.include });
    await this.run();
  }

  /**
   * ADD DOCS
   */
  async _add_record() {
    this.set_disabled(true);
    await CN_api.post(this.get_model().get_base_path("api"), {
      table_name: this._add_table_form_input.get_value(),
      column_name: this._add_column_form_input.get_value(),
      subtype: this._add_subtype_form_input.get_value(),
      rank: this.get_total_records() + 1,
    });
    await this.run();
  }
}
