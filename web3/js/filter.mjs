import CN_element from "./element.mjs";
import CN_common from "./common.mjs";

const STRING_OPERATORS = {
  is: "is",
  is_not: "is not",
  is_like: "is like",
  is_not_like: "is not like"
};

const NUMBER_OPERATORS = {
  greater_than: "is greater than",
  greater_than_equals: "is greater than or equal to",

  less_than: "is less than",
  less_than_equals: "is less than or equal to",

  equal_to: "is equal to",
}

const DATE_OPERATORS = {
  equal_to: "is equal to",

  after: "is after",
  after_or_at: "is after or at",

  before: "is before",
  before_or_at: "is before or at",
};

const BOOLEAN_OPERATORS = {
  is: "is",
  is_not: "is not"
}

const OPERATOR_MAP = {
  is: "=",
  is_not: "!=",
  is_like: "LIKE",
  is_not_like: "NOT LIKE",

  greater_than: ">",
  greater_than_equals: ">=",

  less_than: "<",
  less_than_equals: "<=",

  equal_to: "=",
  not_equal: "!="
}

export default class CN_filter_modal {
  #column;
  #parent_el;
  #filter;
  #title;
  #options;
  #clear_btn;
  #modal_el;
  #modal_body;
  #save_btn;
  #close_btn;
  #bootstrap_modal;
  #listeners = [];

  /**
   * Constructor, attaches the modal to parentEl
   * @param {*} parent_el - the parent element
   * @param {*} options - modal text
   */
  constructor(parent_el, options = { title: "", table_name: "", message: "", ok_text: "", cancel_text: "" }) {
    this.#parent_el = parent_el;
    this.#options = options;

    this.#modal_el = CN_element.create(`
      <div id="filter-modal" class="modal fade" tabindex="-1">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">
                ${options.title}
              </h5>
            </div>
            <div class="modal-body">
            </div>
            <div class="modal-footer d-flex justify-content-between">
              <div>
                <button id="clear" type="button" class="btn btn-outline-danger" data-dismiss="modal">
                  Remove <i class="bi bi-x-circle"></i>
                </button>
              </div>
              <div>
                <button id="cancel" type="button" class="btn btn-outline-danger" data-dismiss="modal">${options.cancelText}</button>
                <button id="ok" type="button" class="btn btn-primary">${options.okText}</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `);
    this.#title = this.#modal_el.querySelector('.modal-title');
    this.#modal_body = this.#modal_el.querySelector('.modal-body');
    this.#clear_btn = this.#modal_el.querySelector("#clear");
    this.#save_btn = this.#modal_el.querySelector('#ok');
    this.#close_btn = this.#modal_el.querySelector('#cancel');

    this.#save_btn.addEventListener('click', this.save.bind(this));
    this.#close_btn.addEventListener('click', this.close.bind(this));
    this.#clear_btn.addEventListener('click', this.clear.bind(this));

    this.#bootstrap_modal = new bootstrap.Modal(this.#modal_el);
    this.#parent_el.appendChild(this.#modal_el);
  }

  /**
   * Attaches a listener to this object, the listener must implement
   * on_filter_save(column) and on_filter_clear(column)
   * @param {*} listener
   */
  add_listener(listener) {
    this.#listeners.push(listener);
  }

  /**
   * Event that fires whenever the user presses 'save'
   */
  on_save() {
    this.#listeners.forEach((listener) => listener.on_filter_save(this.#column));
  }

  /**
   * Event that fires whenever the user presses 'remove'
   */
  on_clear() {
    this.#listeners.forEach((listener) => listener.on_filter_clear(this.#column));
  }

  /**
   * Opens the model, using the filter attached to the column
   * or creates a new filter and attaches it
   * @param {*} column - the table column to open
   */
  open(column) {
    this.#column = column;
    this.set_title(`Restrict ${column.title}`);

    const type = this.#column.type ? this.#column.type : "string"
    const operator = (type === "number" || type === "date") ? "equal_to" : "is";

    if (this.#column.filter != null) {
      this.#filter = this.#column.filter;
    } else {
      this.#filter = new Filter(new Condition(operator, "", null, type), type);
    }

    this.#filter.set_view(this);
    this.render();
    this.#bootstrap_modal.show();
  }

  /**
   * Saves the filter to the column and closes the modal, then fires the on_save event
   */
  save() {
    this.#column.filter = this.#filter;
    this.#bootstrap_modal.hide();
    this.on_save();
  }

  /**
   * Adds a new restriction to the filter and rerenders the component
   */
  add_condition() {
    this.#filter.add_condition("AND", "is", "");
    this.render();
  }

  /**
   * Closes the modal
   */
  close() {
    this.#bootstrap_modal.hide();
  }

  /**
   * Sets the title of the modal to title
   * @param {string} title
   */
  set_title(title) {
    this.#title.innerHTML = title;
  }

  /**
   * Deletes the filter and hides the modal, then fires the on_clear event
   */
  clear() {
    this.#filter.clear();
    delete this.#column.filter;
    this.render();

    this.#bootstrap_modal.hide();
    this.on_clear();
  }

  /**
   * Renders the component
   */
  render() {
    this.#modal_body.innerHTML = '';
    const description_el = CN_element.create(`
      <p class="fs-6">
        Provide how you wish to restrict the <strong>
        ${CN_common.uc_first(this.#options.tableName)}</strong> listing based on the <strong>
        ${CN_common.uc_first(this.#column.title)}</strong> column
      </p>`
    );
    this.#modal_body.appendChild(description_el);
    this.#modal_body.appendChild(this.#filter.render());
  }
}

class Filter {
  #parent = null;
  #el = null;
  #conditions = [];
  #value_type = null; // number, string, date

  /**
   * Filter is the contents of the modal and manages adding/removing/updating conditions
   *
   * @param {Condition} initial_condition - The default condition
   * @param {string} value_type - what is the input type (string, number, date..)
   */
  constructor(initial_condition, value_type) {
    initial_condition.add_listener(this);
    this.#conditions.push(initial_condition);
    this.#value_type = value_type;
  }

  /**
   * Getters/setters
   */

  get_view() { return this.#parent; }
  set_view(view) { this.#parent = view; }
  get_conditions() { return this.#conditions; }
  set_conditions(conditions) { this.#conditions = conditions; }
  get_value_type() { return this.#value_type; }
  set_value_type(value_type) { this.#value_type = value_type; }

  /**
   * Returns the first condition in the list
   *
   * @returns {Condition} - the condition
   */
  first() {
    return this.#conditions[0];
  }

  /**
   * Returns the last condition in the list
   *
   * @returns {Condition} - the condition
   */
  last() {
    return this.#conditions[this.#conditions.length - 1];
  }

  /**
   * Returns the condition at index
   *
   * @param {int} index
   * @returns {Condition} condition
   */
  get(index) {
    return this.#conditions[index];
  }

  /**
   * Event handler for when the user deletes a condition
   *
   * @param {Condition} condition
   */
  on_condition_removal(condition) {
    this.remove(condition);
    if (this.#parent) {
      this.#parent.render();
    }
  }

  /**
   * Removes the condition from the list
   *
   * @param {Condition} condition
   */
  remove(condition) {
    this.#conditions = this.#conditions.filter((cur_condition) => cur_condition !== condition);
  }

  /**
   * Adds a new condition using the provided operator, comparison, and value
   *
   * @param {string "AND|OR"} operator
   * @param {string} comparison
   * @param {any} value
   * @returns
   */
  add_condition(operator, comparison, value) {
    let condition = new Condition(comparison, value, operator, this.#value_type);
    condition.add_listener(this);
    condition.set_allow_removal(true);

    this.#conditions.push(condition);

    return this;
  }

  clear() {
    this.#conditions = [this.#conditions[0]];
    this.#conditions[0].set_value("");
  }

  get_modifiers(column_name) {
    const modifiers = [];
    modifiers.push({
      "bracket": true,
      "open": true
    });

    for (let i = 0; i < this.#conditions.length; i++) {
      const condition = this.#conditions[i];

      const modifier = {
        "column": column_name,
        "operator": OPERATOR_MAP[condition.get_comparison()],
        "value": condition.get_value(),
      };

      if (condition.get_comparison() === "is_like" || condition.get_comparison() === "is_not_like") {
        if (condition.get_value().length == 0) {
          modifier["value"] = "<=>";
        }
        else if (!condition.get_value().includes("%")) {
          modifier["value"] = `%${modifier["value"]}%`;
        }
      }

      if (condition.get_data_type() === "boolean") {
        modifier["value"] = condition.get_value() === "true";
      }

      if (condition.get_operator() === "OR") {
        modifier["or"] = true;
      }

      modifiers.push(modifier);
    }

    modifiers.push({
      "bracket": true,
      "open": false,
      "or": false
    });

    return modifiers;
  }

  /**
   * Serializes the filter to a json object, can be deserialized by passing the returned json
   * to the load_filter function
   *
   * @param {*} col_name
   * @returns
   */
  save_to_json(col_name) {
    let column_data = { "n": col_name, "c": [] };
    let modifiers = [];
    for (let i = 0; i < this.#conditions.length; i++) {
      let condition = this.#conditions[i];
      modifiers.push({
        "c": condition.get_comparison(),
        "d": condition.get_data_type(),
        "v": condition.get_value(),
        "o": condition.get_operator()
      });
    }
    column_data["c"] = modifiers;
    return column_data;
  }

  render() {
    this.#el = CN_element.create(`<div id="filter"></div>`);

    for (let cur of this.#conditions) {
      const condition = cur.render();
      this.#el.appendChild(condition);
    }

    const add_condition_btn = CN_element.create(`
      <button id="add-condition" type="button" class="btn btn-primary btn-sm w-100 mb-2">
        Add Filter <i class="bi bi-plus"></i>
      </button>
    `);
    add_condition_btn.addEventListener('click', () => this.#parent.add_condition());
    this.#el.appendChild(add_condition_btn);
    return this.#el;
  }

  to_string() {
    let str = "";
    for (let condition of this.#conditions) {
      str += condition.to_string();
      if (condition.operator != null) {
        str += " " + cur.operator + " ";
      }
    }
    return str;
  }
}

class Condition {
  #allow_removal = false;
  #value;            // string, date, number
  #comparison;       // IS, IS_NOT, LIKE ...
  #operator;         // AND, OR

  #data_type;        // "string", "date", "number"
  #listeners = [];   // should just be the parent 'filter' class instance

  #operator_select_el;
  #comparison_select_el;
  #value_input_el;

  constructor(comparison, value, operator = null, data_type = "string") {
    this.#comparison = comparison;
    this.#value = value;
    this.#operator = operator;
    this.#data_type = data_type;
  }

  // Getters/setters
  get_allow_removal() { return this.#allow_removal; }
  set_allow_removal(allow_removal) { this.#allow_removal = allow_removal; }
  get_comparison() { return this.#comparison;}
  set_comparison(comparison) { this.#comparison = comparison; }
  get_operator() { return this.#operator; }
  set_operator(operator) { this.#operator = operator; }
  get_value() { return this.#value; }
  set_value(value) { this.#value = value; }
  get_data_type() { return this.#data_type; }
  set_data_type(data_type) { this.#data_type = data_type; }
  add_listener(listener) {
    this.#listeners.push(listener);
  }

  on_change() {
    for (let listener of this.#listeners) {
      listener.on_condition_change(this);
    }
  }

  on_remove() {
    for (let listener of this.#listeners) {
      listener.on_condition_removal(this);
    }
  }

  on_value_change(event) {
    this.#value = event.target.value;
  }

  on_empty_clicked(event) {
    this.#value = null;
    this.#value_input_el.value = null;
  }

  on_comparison_select(event) {
    this.#comparison = event.target.value;
  }

  on_operator_select(event) {
    this.#operator = event.target.value;
  }

  render() {
    const condition = CN_element.create('<div class="row"></div>');

    if (this.#operator) {
      this.#operator_select_el = CN_element.create(`
        <select class="form-select" name="operator-select" style="flex-grow: unset; flex-basis: 90px" aria-label="Operator select">
          <option selected value="AND">AND</option>
          <option value="OR">OR</option>
        </select>
      `);

      this.#operator_select_el.value = this.#operator;
      this.#operator_select_el.addEventListener('change', this.on_operator_select.bind(this));
    }

    let value_input = null;
    if (this.#data_type === "boolean") {
      value_input = CN_element.create(`
        <select value="${this.#value ? this.#value : null}" class="form-control">
          <option value="null">(empty)</option>
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>
      `);

      value_input.value = this.#value ? this.#value : null;
      value_input.addEventListener('change', this.on_value_change.bind(this));
    }
    else {
      value_input = CN_element.create(`
        <input class="form-control" type="${this.#data_type}" value="${this.#value}" placeholder="(empty)" />
      `);
      value_input.addEventListener('input', this.on_value_change.bind(this));
    }
    this.#value_input_el = value_input;

    const input_group_el = CN_element.create('<div class="input-group py-2"></div>');
    const comparison_select = this.#render_comparison_select();
    if (this.#operator) {
      input_group_el.appendChild(this.#operator_select_el);
    }
    input_group_el.appendChild(comparison_select);
    input_group_el.appendChild(value_input);

    if (this.#allow_removal) {
      const remove_btn = CN_element.create(`
        <button type="button" class="btn btn-danger"><i class="bi bi-trash"></i></button>
      `);
      remove_btn.addEventListener('click', this.on_remove.bind(this));
      input_group_el.appendChild(remove_btn);
    }

    condition.appendChild(input_group_el);
    return condition;
  }

  #render_comparison_select() {
    let operators = null;

    if (this.#data_type === "number") {
      operators = NUMBER_OPERATORS;
    } else if (this.#data_type === "boolean") {
      operators = BOOLEAN_OPERATORS;
    } else if (this.#data_type === "date") {
      operators = DATE_OPERATORS;
    } else {
      operators = STRING_OPERATORS;
    }

    this.#comparison_select_el = CN_element.create(`
      <select
        name="comparison-select"
        style="flex-grow: unset; flex-basis: 120px"
        class="form-select"
        aria-label="Comparison select"
      >
        ${Object.entries(operators).map(([key, value]) => `<option value=${key}>${value}</option>`).join("")}
      </select>`
    );
    this.#comparison_select_el.addEventListener('change', this.on_comparison_select.bind(this))
    this.#comparison_select_el.value = this.#comparison;

    return this.#comparison_select_el;
  }

  to_string() {
    return `${this.#comparison} ${this.#value}`;
  }
}

/**
 * Creates and returns a filter object using serialized filter data stored in the 'restrict' query parameter.
 * @param {*} filter_data
 * @returns filter object
 * */
export function load_filter(filter_data) {
  const name = filter_data.n;
  const conditions = filter_data.c;
  const first = conditions[0];
  const filter = new Filter(new Condition(first.c, first.v, null, first.d), first.d);
  for (let i = 1; i < conditions.length; i++) {
    let condition = conditions[i];
    filter.add_condition(condition.o, condition.c, condition.v, condition.d);
  }
  return filter;
}