import { CN_action_base_export } from "../action/base_export.mjs"
import { CN_api } from "../api.mjs"
import { CN_common } from "../common.mjs"
import { CN_input_enum } from "../input/enum.mjs"
import { CN_input_rank } from "../input/rank.mjs"
import { CN_input } from "../input/input.mjs"
import { CN_base_model } from "./base_model.mjs"

export class CN_model_export_restriction extends CN_base_model {
  constructor() {
    super({
      wording: {
        singular: "restriction",
        plural: "restrictions",
        posessive: "restriction's",
      },
    });
  }
}

export class CN_list_export_restriction extends CN_action_base_export {
  /**
   * Extend parent method
   */
  update_element() {
    super.update_element();

    // add columns to the body
    const tbody_el = this.get_body_element().querySelector("tbody");
    tbody_el.innerHTML = "";
    this.get_record_list().forEach((record, index) => {
      const table_object = this.get_table(record.table_name);
      if (null == table_object.column_enum_list) return;
      const column_object = table_object.column_enum_list.find(c => c.key == record.column_name);

      const tr_el = this.constructor.html(`
        <tr id="export_column_${record.id}">
          <td name="rank" class="border border-light border-2 px-0 py-1 border-start-0"></td>
          <td name="logic" class="border border-light border-2 px-0 py-1 border-start-0"></td>
          <td name="table" class="border border-light border-2 px-3 py-1"></td>
          <td name="column" class="border border-light border-2 px-3 py-1"></td>
          <td name="subtype" class="border border-light border-2 px-0 py-1"></td>
          <td name="test" class="border border-light border-2 px-0 py-1"></td>
          <td name="value" class="border border-light border-2 px-3 py-1"></td>
          <td name="delete" class="border border-light border-2 px-0 py-1">
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

      // do not show the first logic enum
      if (0 < index) {
        record.logic_form_input = CN_input_enum.append(tr_el.querySelector("td[name=logic]"), {
          name: "logic",
          required: true,
          enum: {
            values: this.get_model().get_module().get_property("logic").enum_list.map(
              v => ({ key: v, value: v.toUpperCase() })
            ),
          },
          get_default: () => record.logic,
          on_change: this._update_record.bind(this, record, "logic"),
        });
      }

      tr_el.querySelector("td[name=table]").innerHTML = CN_common.format_variable_name(record.table_name);
      tr_el.querySelector("td[name=column]").innerHTML =
        CN_common.format_variable_name(record.column_name).replace(/ ID$/, "");

      if (record.subtype) {
        record.subtype_form_input = CN_input_enum.append(tr_el.querySelector("td[name=subtype]"), {
          name: "subtype",
          required: true,
          enum: { values: table_object.subtype_enum_list },
          get_default: () => record.subtype,
          on_change: this._update_record.bind(this, record, "subtype"),
        });
      }

      // build the test enum list based on the column's type
      const test_enum_list = [
        { key: "<=>", value: "IS" },
        { key: "<>", value: "IS NOT" },
      ];

      if (CN_common.is_datetime_type(column_object.type)) {
        test_enum_list.push({ key: "<", value: "BEFORE" });
        test_enum_list.push({ key: ">", value: "AFTER" });
      } else if ("string" == column_object.type) {
        test_enum_list.push({ key: "like", value: "LIKE" });
        test_enum_list.push({ key: "not like", value: "NOT LIKE" });
      }

      record.test_form_input = CN_input_enum.append(tr_el.querySelector("td[name=test]"), {
        name: "test",
        required: true,
        enum: { values: test_enum_list },
        get_default: () => record.test,
        on_change: this._update_record.bind(this, record, "test"),
      });

      const params = {
        name: "value",
        required: false,
        get_default: () => "boolean" == column_object.type ? !!record.value : record.value,
        on_change: this._update_record.bind(this, record, "value"),
      };
      if ("enum" == column_object.type) params.enum = column_object.enum;
      record.value_form_input = CN_input.create_input(
        column_object.type,
        tr_el.querySelector("td[name=value]"),
        params,
      );
      tr_el.querySelector("td[name=value]").append(record.value_form_input.get_element());

      record.delete_btn_el = this.constructor.html(
        '<button name="delete" class="btn btn-small btn-danger"><i class="bi bi-x-circle-fill"></i></button>'
      );
      record.delete_btn_el.addEventListener("click", this._delete_record.bind(this, record));
      tr_el.querySelector("td[name=delete]").append(record.delete_btn_el);

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
          Add restrictions if you wish to narrow down the list of participants included in the returned data.<br>
          If you do not add any restrictions then all participants available to this application will be included.
        </div>
        <table class="table table-striped table-hover align-middle my-2">
          <thead>
            <tr>
              <th width="8%">Rank</th>
              <th width="8%">Logic</th>
              <th width="18%">Table</th>
              <th width="18%">Column</th>
              <th width="18%">Sub-Type</th>
              <th width="8%">Test</th>
              <th width="18%">Value</th>
              <th width="4%"></th>
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
  async _add_record() {
    this.set_disabled(true);
    await CN_api.post(this.get_model().get_base_path("api"), {
      table_name: this._add_table_form_input.get_value(),
      column_name: this._add_column_form_input.get_value(),
      subtype: this._add_subtype_form_input.get_value(),
      rank: this.get_total_records() + 1,
      logic: "and",
      test: "<=>",
    });
    await this.run();
  }
}
