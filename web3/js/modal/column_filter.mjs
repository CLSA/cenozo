import { CN_api } from "../api.mjs"
import { CN_base_modal } from "./base_modal.mjs"
import { CN_common } from "../common.mjs";
import { CN_element_label } from "../element/label.mjs"
import { CN_input } from "../input/input.mjs"
import { CN_input_enum } from "../input/enum.mjs"
import { CN_input_text } from "../input/text.mjs"

export class CN_modal_column_filter extends CN_base_modal {
  #condition_list = [];
  #operator_list;
  #desc_form_input;
  #description_el;
  #conditions_el;

  constructor(config) {
    super({
      ...{
        table: null,
        column: null,
        model: null,
        ok_text: "OK",
        cancel_text: "Cancel"
      },
      ...config,
    });

    const column_name = `<span class="text-secondary">${this.get_config("column").title}</span>`;
    const table_name = `<span class="text-secondary">${this.get_config("table")}</span>`;
    this.set_config("title", `Filter ${column_name}</span> Column in ${table_name} Table`);

    // add the resolve buttons
    this.add_resolve_button("light", this.get_config("cancel_text"), () => this._resolve(undefined));
    this.add_resolve_button(
      "success",
      this.get_config("ok_text"),
      () => this._resolve(this.#condition_list.map(c => ({ operator: c.operator, value: c.value, or: c.or }))),
      true, // submit on enter key
    );

    // determine the operator list based on the type
    const column = this.get_config("column");
    const is_datetime = CN_common.is_datetime_type(column.type);
    this.#operator_list = [
      { key: "=", value: "is" },
      { key: "!=", value: "is not" },
    ];
    if (is_datetime || ["integer", "float", "size"].includes(column.type)) {
      this.#operator_list = [
        ...this.#operator_list,
        { key: "<", value: is_datetime ? "is before" : "is less than" },
        {
          key: "<=",
          value: (
            is_datetime ?
            "is before or " + ("date" == column.type ? "on" : "at") :
            "is less or equal to"
          ),
        },
        { key: ">", value: is_datetime ? "is after" : "is greater than" },
        {
          key: ">=",
          value: (
            is_datetime ?
            "is after or " + ("date" == column.type ? "on" : "at") :
            "is greater or equal to"
          ),
        },
      ];
    } else if (column.type != "boolean") {
      this.#operator_list = [
        ...this.#operator_list,
        { key: "LIKE", value: "is like" },
        { key: "NOT LIKE", value: "is not like" },
      ];
    }

    // create the condition list from the provided column's condition list
    column.condition_list.forEach(condition => this.add_condition(condition));

    // if none were provided then create one default condition
    if (0 == this.#condition_list.length) this.add_condition();
  }

  /**
   * ADD DOCS
   */
  add_condition(condition = { operator: "=", value: null, or: false }) {
    const index = this.#condition_list.length;
    const column = this.get_config("column");
    const model = this.get_config("model");

    condition.element = this.constructor.html('<div class="d-flex w-100 py-2"></div>');

    // add the or dropdown
    if (0 < index) {
      condition.or_input = new CN_input_enum(condition.element, {
        required: true,
        get_default: () => condition.or,
        enum: {
          values: [
            { key: false, value: "AND" },
            { key: true, value: "OR" },
          ],
        },
        on_change: async (form_input, valid) => {
          condition.or = form_input.get_value_for_record();
          await this.#check_form();
        },
      });
      condition.element.append(condition.or_input.get_element());
    }

    // add the operator dropdown
    condition.operator_input = new CN_input_enum(condition.element, {
      required: true,
      get_default: () => condition.operator,
      enum: { values: this.#operator_list },
      on_change: async (form_input, valid) => {
        condition.operator = form_input.get_value_for_record();
        await this.#check_form();
      },
    });
    condition.element.append(condition.operator_input.get_element());

    // add the value input
    const config = {
      class: "flex-grow-1",
      placeholder: "(empty)",
      required: false,
      get_default: () => condition.value,
      on_change: async (form_input, valid) => {
        condition.value = form_input.get_value_for_record();
        await this.#check_form();
      },
    };

    // specify the max rank for rank columns
    if ("rank" == column.type) {
      config.max_rank = (
        column.max_rank ?
        column.max_rank :
        async () => {
          const response = await CN_api.get(model.get_base_path("api"), {
            select: { column: {
              column: `max(${model.get_name()}.${column.name})`,
              alias: "max_rank",
              table_prefix: false
            } },
          });
          return Number(null == response[0].max_rank ? 0 : response[0].max_rank);
        }
      );
    }

    condition.value_input = CN_input.create_input(column.type, condition.element, config);
    condition.element.append(condition.value_input.get_element());

    // add the remove button
    if (0 < index) {
      condition.remove_btn_el = this.constructor.html(
        '<button type="button" class="btn btn-danger"><i class="bi bi-trash"></i></button>'
      );
      condition.remove_btn_el.addEventListener("click", () => {
        this.#condition_list.splice(index, 1);
        this.update_element();
      });
      condition.element.append(condition.remove_btn_el);
    }

    this.#condition_list.push(condition);
  }

  /**
   * Extend parent method
   */
  _create_body_element() {
    const body_el = this.constructor.html(`
      <div>
        <div name="conditions"></div>
        <button type="button" name="add" class="btn btn-primary w-100">Add Extra Condition</button>
      </div>
    `);
    this.#conditions_el = body_el.querySelector("div[name=conditions]");

    // create the add condition button at the bottom
    const add_btn_el = body_el.querySelector("button[name=add]");
    add_btn_el.addEventListener("click", () => {
      this.add_condition();
      this.update_element();
    });
    body_el.append(add_btn_el);

    return body_el;
  }

  /**
   * Extend parent method
   */
  _create_footer_element() {
    const footer_el = super._create_footer_element();

    const remove_btn_el = this.constructor.html('<button type="button" class="btn btn-danger">Remove</button>');
    remove_btn_el.addEventListener("click", () => this._resolve([]));
    footer_el.querySelector("div[name=left-btn-group]").append(remove_btn_el);

    return footer_el;
  }

  /**
   * ADD DOCS
   */
  async #check_form() {
    let invalid = false;

    // validate all condition inputs setting invalid to true if any fail
    await Promise.all(
      this.#condition_list.map(condition => (async () => {
        if (!(await condition.value_input.validate())) invalid = true;
      })())
    );

    this.constructor.set_disabled(this.get_resolve_button(this.get_config("ok_text")).element, invalid);
  }

  /**
   * ADD DOCS
   */
  update_element() {
    super.update_element();

    // re-create the condition list
    this.#conditions_el.innerHTML = "";
    this.#condition_list.forEach(condition => this.#conditions_el.append(condition.element));
  }
}
