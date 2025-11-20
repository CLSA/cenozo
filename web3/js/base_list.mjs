import CN_api from "./api.mjs"
import CN_common from "./common.mjs"
import CN_element from "./element.mjs"
import CN_session from "./session.mjs"
import { CN_base_action } from "./base_action.mjs"
import CN_filter_modal, { load_filter } from "./filter.mjs"

export class CN_base_list extends CN_base_action {
  #list_mode;
  #columns;
  #records = [];
  #total_records = null;
  #limit = null;
  #offset = null;
  #current_page = 1;
  #filter_modal;
  #is_choosing = false;
  #choosing_list;

  /**
   * Constructor
   * TODO: document a full description of the columns parameter
   * @param base_model model: The model that the list action belongs to
   */
  constructor(model) {
    super("list", model);

    // determine whether the list is in choosing mode
    const parent_model = this.get_model().get_parent_model();
    this.#list_mode = (
      null != parent_model && parent_model.get_module().has_choose(model.get_name()) ?
      "choose" :
      "add"
    );

    // setup each column
    const page_param = this.get_query_parameter("page");
    if (page_param) {
      this.#current_page = page_param;
    }

    const order_param = this.get_query_parameter("order");
    const reverse_param = this.get_query_parameter("reverse");

    this.#columns = model.clone_columns();
    for (const col_name in this.#columns) {
      const column = this.#columns[col_name];
      if (!column.type) column.type = "string";

      // by default always prefix the table name
      if (undefined === column.table_prefix) column.table_prefix = true;

      // by default center align all columns except for text columns
      if (undefined === column.align) column.align = "text" == column.type ? "left" : "center";

      // define the is_hidden function if it hasn't been defined
      if (!CN_common.is_function(column.is_hidden)) {
        column.is_hidden = (model) => {
          if (!column.column) return false;

          // if there's a parent then don't show columns belonging to the parent's name
          const parent_model = model.get_parent_model();
          return null != parent_model && column.column.match(`${parent_model.get_name()}\.`);
        };
      }

      column.col_name = col_name;
      if ((order_param != null && reverse_param != null) && order_param === col_name) {
        column.order = true;
        column.reverse = reverse_param == "true";
      }
    }

    const restrict = this.get_query_parameter("restrict");
    // Load each columns filter and order state from URL query parameters
    if (restrict) {
      const filters = JSON.parse(restrict);
      for (const filter_data of filters) {
        const col = this.#columns[filter_data.n];
        const filter = load_filter(filter_data);
        col.filter = filter;
      }
    }

    this.#filter_modal = new CN_filter_modal(document.getElementById('main-content'),
      {
        title: "Filter",
        tableName: this.get_model().get_singular(),
        message: "",
        okText: "Ok",
        cancelText: "Cancel"
      }
    );
    this.#filter_modal.add_listener(this);
  }

  // access methods
  is_choosing() { return this.#is_choosing; }
  get_total_records() { return this.#total_records; }

  /**
   * Extends the parent method
   */
  async get_text(type) {
    if ("crumb" == type) {
      return CN_common.uc_words(this.get_model().get_plural());
    }

    if ("header" == type) {
      return `${CN_common.uc_words(this.get_model().get_singular())} List`;
    }

    if ("add" == type) {
      return `Add ${CN_common.uc_words(this.get_model().get_singular())}`;
    }

    if ("choose" == type) {
      return `Choose ${CN_common.uc_words(this.get_model().get_plural())}`;
    }

    return await super.get_text(type);
  }

  /**
   * Called when the list's add button is clicked
   */
  async on_add() {
    await CN_session.navigate_to(this.get_model().get_add_url());
  }

  /**
   * Called when one of the list's delete buttons are clicked
   * @param object record: One of the records from the #records array
   */
  async on_delete(record) {
    // first confirm
    const modal = CN_element.confirm_modal({
      static: true,
      title: "Please Confirm",
      message: `Are you sure you wish to delete the ${this.get_model().get_singular()} record?`,
    });

    if (await modal.test()) {
      await CN_api.delete(`${this.get_model().get_name()}/${record.id}`);
      await this.run();
    }
  }

  /**
   * Called when a choose-based list's choose or apply button is clicked
   */
  async on_choose() {
    if (this.#is_choosing) {
      // send selected records back to the server
      if (0 < this.#choosing_list.add.length || 0 < this.#choosing_list.remove.length) {
        const params = {};
        if (0 < this.#choosing_list.add.length) params.add = this.#choosing_list.add;
        if (0 < this.#choosing_list.remove.length) params.remove = this.#choosing_list.remove;
        await CN_api.post(this.get_model().get_base_path("api"), params);
      }
    }

    // toggle the is_choosing state
    this.#is_choosing = !this.#is_choosing;
    await this.run();
  }

  /**
   * Called when a choose-based list's cancel button is clicked
   */
  async on_cancel_choose() {
    this.#is_choosing = false;
    await this.run();
  }

  /**
   * Makes an API call to get table data
   */
  async get_records() {
    this.on_pre_loading();

    const response = await CN_api.get(this.get_model().get_base_path("api"), this.get_on_load_parameters(), true);
    this.#limit = response.headers.get('X-Limit');
    this.#offset = response.headers.get('X-Offset');
    this.#total_records = response.headers.get('X-Total');

    // replace the records at the current page with the returned records
    //const records = await response.json();
    this.#records = await response.json();
    this.on_post_loading();
    this.update_element();
  }

  /**
   * Override the parent method
   */
  get_on_load_path() {
    return this.get_model().get_base_path("api");
  }

  /**
   * Extend the parent method
   */
  get_on_load_parameters() {
    let params = {
      modifier: {
        limit: CN_session.data.application.list_row_size,
        offset: (this.#current_page - 1) * 20,
        order: [],
        where: []
      },
      select: { column: [] },
    };

    // set the query's limit and offset based on the current page
    if (this.#is_choosing) params.choosing = 1;

    for (const col_name in this.#columns) {
      const col = this.#columns[col_name];
      if (col.table_prefix) {
        let table = this.get_model().get_name();
        let name = col_name;
        if (col.column) [table, name] = col.column.split(".");
        params.select.column.push({ table: table, column: name, alias: col_name });
      } else if (col.column) {
        params.select.column.push({ column: col.column, alias: col_name, table_prefix: false });
      } else {
        // no table prefix means just add the column name
        params.select.column.push(col_name);
      }
      if (col.order) {
        params.modifier.order.push({ [col_name]: col.reverse });
      }

      if (col.filter) {
        const column_modifier = col.filter.get_modifiers(col_name);
        params.modifier.where.push(...column_modifier);
      }
    }

    return params;
  }

  /**
   * Extends parent method
   */
  async on_load() {
    const model = this.get_model();
    const parent_model = model.get_parent_model();
    const response = await CN_api.get(this.get_on_load_path(), this.get_on_load_parameters(), true);

    this.#limit = response.headers.get('X-Limit');
    this.#offset = response.headers.get('X-Offset');
    this.#total_records = response.headers.get('X-Total');

    // update the parent's child list record count
    if (parent_model && "view" == parent_model.get_action_name()) {
      const child_lists_el = parent_model.get_element().querySelector("div[name=child-lists]");
      if (child_lists_el) {
        const btn_el = child_lists_el.querySelector(`button[name=${model.get_name()}]`);
        if (btn_el) {
          btn_el.innerHTML = btn_el.innerHTML.replace(/ \[[0-9.]+\]/, ` [${this.#total_records}]`);
        }
      }
    }

    // replace the records at the current page with the returned records
    this.#records = await response.json();

    // run all filters, creating a list of promises as we go
    const promise_list = [];
    for (const col_name in this.#columns) {
      const column = this.#columns[col_name];
      if (CN_common.is_function(column.filter)) {
        promise_list.push(...this.#records.map(record =>
          (async () => record[col_name] = await column.filter(model, record))()
        ));
      }
    }

    // run all filter promises in parallel
    await Promise.all(promise_list);

    if (this.#is_choosing) {
      // make note of chosen records
      this.#choosing_list = {
        current: this.#records.filter(record => record.chosen).map(record => record.id),
        add: [],
        remove: [],
      };
    } else {
      this.#choosing_list = null;
    }
  }

  /**
   * Extends parent method
   */
  show_placeholder() {
    super.show_placeholder();

    const body_el = this.get_element().querySelector("table [name=body]");
    body_el.innerHTML = "";
    for (let row = 0; row < 20; row++) {
      let tr_el = document.createElement("tr");
      for (const col_name in this.#columns) {
        let col = Math.ceil(Math.random() * 5) + 5;
        tr_el.innerHTML += `
          <td class="placeholder-glow">
            <span class="placeholder placeholder-lg bg-dark bg-opacity-50 col-${col}"></span>
          </td>
        `;
      }
      body_el.append(tr_el);
    }
  }

  /**
   * Determines whether a record cannot be selected when in choose mode
   * @param object record: One of the records from the #records array
   * @return boolean
   */
  is_choose_disabled(record) {
    return false;
  }

  /**
   * Updates the sort that is applied to a column and updates the table.
   * Iterates through No sort -> ascending -> descending
   * and updates the query parameters and column state.
   * @param {*} event
   * @param {*} column
   */
  async on_table_header_click(event, column) {
    this.remove_table_header_sorts(column);
    const previous_sort = column.el.hasAttribute("sort") ? column.el.getAttribute("sort") : "";

    let next_sort;
    if (previous_sort === "") {
      next_sort = "ascending";
    } else if (previous_sort === "ascending") {
      next_sort = "descending";
    } else if (previous_sort === "descending") {
      next_sort = "";
    } else {
      throw new Error("Unknown sort");
    }

    const sort_icon = column.el.querySelector(".sort-icon");

    if (next_sort === "") {
      delete column.order;
      delete column.reverse;

      column.el.setAttribute("sort", "");
      sort_icon.classList.remove('bi-sort-up');
    } else if (next_sort === "ascending") {
      column.order = true;
      column.reverse = false;

      sort_icon.classList.add('bi-sort-down');
    } else if (next_sort === "descending") {
      column.order = true;
      column.reverse = true;

      sort_icon.classList.remove('bi-sort-down');
      sort_icon.classList.add('bi-sort-up');
    }

    column.el.setAttribute("sort", next_sort);

    this.update_query_parameters()
    this.get_records();
  }

  /**
   * Removes all sorts applied to the column, excluding exclude_col.
   * @param {*} exclude_col
   */
  remove_table_header_sorts(exclude_col) {
    for (const col_name in this.#columns) {
      let column = this.#columns[col_name];
      if (column == exclude_col) continue;

      delete column.order;
      delete column.reverse;

      if (column.el?.hasAttribute("sort")) {
        column.el.removeAttribute('sort');
        column.el.querySelector('.sort-icon').classList.remove('bi-sort-up');
        column.el.querySelector('.sort-icon').classList.remove('bi-sort-down');
      }
    }
  }

  /**
   * Called when one of the lists's rows is clicked
   * @param object record: One of the records from the #records array
   */
  async on_row_click(record) {
    if (this.#is_choosing) {
      // do nothing if the record is disabled
      if (this.is_choose_disabled(record)) return;

      // toggle the record's chosen state
      record.chosen = !record.chosen;

      let list_type = this.#choosing_list.current.includes(record.id) ? "remove" : "add";
      let add = (
        this.#choosing_list.current.includes(record.id) ?
        !record.chosen :
        record.chosen
      );

      if (add) {
        if (!this.#choosing_list[list_type].includes(record.id)) {
          this.#choosing_list[list_type].push(record.id);
        }
      } else {
        let index = this.#choosing_list[list_type].indexOf(record.id);
        if (-1 !== index) this.#choosing_list[list_type].splice(index, 1);
      }

      this.update_element();
    } else if (this.get_model().allow_view()) {
      await CN_session.navigate_to(this.get_model().get_view_url(record.id));
    }
  }

  /**
   * Extends parent method
   */
  update_element() {
    super.update_element();
    this.update_query_parameters();

    for (const col_name in this.#columns) {
      const col = this.#columns[col_name];
      if ("order" in col && "reverse" in col) {
        const sort = col.reverse ? "descending" : "ascending";

        col.el.querySelector('.sort-icon').classList.add(sort === "ascending" ? "bi-sort-down" : "bi-sort-up");
        col.el.setAttribute('sort', sort);
      }

      if (col.filter) {
        const filter_el = col.el.querySelector('.filter-icon');
        filter_el.classList.remove('bi-filter')
        filter_el.classList.add('bi-filter-circle-fill')
      }
    }

    const btn_group_el = this.get_footer_element().querySelector("div.btn-group");
    let btn_el = this.get_footer_element().querySelector(`[name=${this.#list_mode}]`);

    if ("add" == this.#list_mode) {
      // if we have no add button and adding is allowed then create it
      if (null == btn_el && this.get_model().allow_add()) {
        btn_el = CN_element.create('<button name="add" type="button" class="btn btn-primary"></button>');
        btn_group_el.append(btn_el);
        (async () => { btn_el.innerHTML = await this.get_text("add"); })();
        btn_el.addEventListener("click", this.on_add.bind(this));
      } else if (null != btn_el && !this.get_model().allow_add()) {
        // if we have an add button but adding isn't allowed then remove it
        btn_group_el.removeChild(btn_el);
      }
    } else if ("choose" == this.#list_mode) {
      // if choosing is allowed then create the choose button (if needed) and configure it
      if (this.get_model().allow_choose()) {
        if (null == btn_el) {
          btn_el = CN_element.create('<button name="choose" type="button" class="btn btn-primary"></button>');
          btn_group_el.append(btn_el);
          btn_el.addEventListener("click", this.on_choose.bind(this));
        }

        let cancel_btn_el = this.get_footer_element().querySelector("[name=cancel_choose]");
        if (this.#is_choosing) {
          // we're currently choosing records
          btn_el.innerHTML = "Apply";

          // create the cancel button if it doesn't exist
          if (null == cancel_btn_el) {
            cancel_btn_el = CN_element.create(
              '<button name="cancel_choose" type="button" class="btn btn-outline-primary">Cancel</button>'
            );
            cancel_btn_el.addEventListener("click", this.on_cancel_choose.bind(this));
            btn_el.parentElement.prepend(cancel_btn_el);
          }
        } else {
          // we're viewing which records are chosen (not choosing)
          (async () => { btn_el.innerHTML = await this.get_text("choose"); })();

          // remove the cancel button if it exists
          if (null != cancel_btn_el) cancel_btn_el.remove();
        }
      } else if (null != btn_el) {
        // remove the button since it isn't allowed
        btn_group_el.removeChild(btn_el);
      }
    }

    const table_el = this.get_body_element().querySelector("table [name=body]");
    table_el.innerHTML = "";

    const start_index = (this.#current_page - 1) * 20;
    this.#records.map(record => {
      let tr_el = document.createElement("tr");
      if (this.#is_choosing) {
        if (record.chosen) tr_el.classList.add("table-primary");
        if (this.is_choose_disabled(record)) tr_el.style.cursor = "not-allowed";
      }
      tr_el.addEventListener("click", this.on_row_click.bind(this, record));
      for (const col_name in this.#columns) {
        const column = this.#columns[col_name];

        // don't show hidden columns
        if (column.is_hidden(this.get_model())) continue;

        let value = record[col_name];
        if (null === value) {
          value = "(empty)";
        } else if ("boolean" == column.type) {
          value = value ? "Yes" : "No";
        } else if ("html" == column.type) {
          // escape HTML as a plain-text string (leveraging the <option> element to convert HTML to string)
          value = (new Option(value)).innerHTML
        } else if ("size" == column.type) {
          value = CN_common.format_filesize(value);
        } else if (CN_common.is_datetime_type(column.type, "date")) {
          value = CN_common.format_datetime(value, column.type);
        } else if ("rank" == column.type) {
          value = CN_common.ordinal_suffix(value);
        } else if (CN_common.is_datetime_type(column.type, "time")) {
          value = CN_common.format_time(value, column.type);
        } else if (CN_common.is_string(value) && 0 < column.limit) {
          if (value.length > column.limit) {
            value = value.substring(0, column.limit) + " ...";
          }
        }

        tr_el.innerHTML += `<td class="text-${column.align} text-truncate">${value}</td>`;
        //tr_el.innerHTML += `<td>${value}</td>`;
      }

      if ("choose" != this.#list_mode) {
        // add the delete button row, only including a button if deleting is allowed
        tr_el.innerHTML += `
          <td class="col-auto d-flex justify-content-end">
            ${
              this.get_model().allow_delete() ?
              '<button name="delete" class="btn btn-sm btn-danger"><i class="bi-x-circle-fill"></i></button>' :
              ''
             }
          </td>
        `;

        // wire up the delete button if there is one
        if (this.get_model().allow_delete()) {
          tr_el.querySelector("[name=delete]").addEventListener("click", (e) => {
            e.stopPropagation();
            this.on_delete(record);
          });
        }
      }

      table_el.append(tr_el);
    });

    const summary_el = this.get_footer_element().querySelector("[name=summary]");
    summary_el.innerHTML = `${this.#total_records} ${this.get_model().get_plural()} total`;

    // rebuild the pagination buttons
    const pagination_el = this.get_footer_element().querySelector("ul.pagination");
    pagination_el.innerHTML = "";

    const pages = Math.ceil(this.#total_records / CN_session.data.application.list_row_size);

    if (1 < pages) {
      // add the previous button
      const prev_el = CN_element.create(`
        <li class="page-item"><button class="page-link"><i class="bi-rewind-fill"></i></button></li>
      `);
      if (1 == this.#current_page) prev_el.classList.add("disabled");
      pagination_el.append(prev_el);
      prev_el.querySelector("button").addEventListener("click", () => {
        if (1 != this.#current_page) {
          this.#current_page = 1;
          this.run();
        }
      });

      // add pages by number
      // start by assuming we're at the start of the list
      let first_page = 1;
      let last_page = 5 < pages ? 5 : pages;

      if (pages > 5) {
        if (pages - 2 < this.#current_page) {
          // we're at the end of the list, so show the last 5 pages
          first_page = pages - 4;
          last_page = pages;
        } else if (3 < this.#current_page) {
          // we're in the middle of the list, so put the current page in the middle of the page span
          // the first page is now two less than the current page
          first_page = this.#current_page - 2;

          // and the last page is at most to more than the current page
          last_page = this.#current_page + 2 > pages ? pages : this.#current_page + 2;
        }
      }

      for (let page = first_page; page <= last_page; page++) {
        let page_el = CN_element.create(`
          <li class="page-item"><button class="page-link">${page}</button></li>
        `);
        if (page == this.#current_page) page_el.classList.add("active");
        pagination_el.append(page_el);
        page_el.querySelector("button").addEventListener("click", () => {
          if (page != this.#current_page) {
            this.#current_page = page;
            this.run();
          }
        });
      }

      // add the next button
      const next_el = CN_element.create(`
        <li class="page-item"><button class="page-link"><i class="bi-fast-forward-fill"></i></button></li>
      `);
      if (pages == this.#current_page) next_el.classList.add("disabled");
      pagination_el.append(next_el);
      next_el.querySelector("button").addEventListener("click", () => {
        if (pages != this.#current_page) {
          this.#current_page = pages;
          this.run();
        }
      });
    }
  }


  /**
   * Extends parent method
   */
  create_body_element() {
    const width = 100 / Object.entries(this.#columns).length;
    const table_el = CN_element.create(`
      <div class="table-responsive">
        <table class="table table-striped table-hover">
          <colgroup>
            ${Object.entries(this.#columns).map(() => `<col style="width: ${width}%;">`).join("")}
          </colgroup>
          <thead name="header"></thead>
          <tbody name="body"></tbody>
          <tfoot name="footer"></tfooter>
        </table>
      </div>
    `);

    // build the header row
    let header_tr_el = document.createElement("tr");

    for (const col_name in this.#columns) {
      const column = this.#columns[col_name];

      // don't show hidden columns
      if (column.is_hidden(this.get_model())) continue;

      const table_header_el = this.create_table_header_element(column);
      header_tr_el.appendChild(table_header_el);
      this.#columns[col_name]["el"] = table_header_el;
    }

    // if ("choose" != this.#list_mode) {
      //add an empty header for deleting records (width 0 so it isn't shown if deleting isn't allowed)
      // header_tr_el.innerHTML += `<th name="delete" class="col-auto p-0" style="width: 0;" scope="col"></th>`;
    // }

    table_el.querySelector("thead[name=header]").append(header_tr_el);

    return table_el;
  }

  /**
   * Updates the "restrict" query parameter whenever a column filter is saved.
   * @param {*} col
   */
  async on_filter_save(col) {
    this.update_query_parameters();
    await this.run();
  }

  /**
   *
   * @param {*} col
   */
  async on_filter_clear(col) {
    const filter_el = col.el.querySelector('.filter-icon');
    filter_el.classList.remove('bi-filter-circle-fill')
    filter_el.classList.add('bi-filter');

    this.update_query_parameters();
    await this.get_records();
  }

  /**
   * Updates the query parameters with the most recent state
   * @returns
   */
  update_query_parameters() {
    let restrict = [];
    let order = null;
    let reverse = null;

    for (const col_name in this.#columns) {
      const column = this.#columns[col_name];
      if (column.filter) {
        const filter_data = column.filter.save_to_json(col_name);
        restrict.push(filter_data);
      }
      if (column.order != null) order = col_name;
      if (column.reverse != null) reverse = column.reverse;
    }

    this.set_query_parameter("restrict", restrict.length ? JSON.stringify(restrict) : null);
    this.set_query_parameter("page", this.#current_page);
    this.set_query_parameter("order", order);
    this.set_query_parameter("reverse", reverse);
  }

  /**
   * Creates the table header element and adds listeners to the filter buttons that belong to each header
   * @param {*} column
   * @returns
   */
  create_table_header_element(column) {
    const header_el = CN_element.create_fragment(
      `<th name="${column.title}" class="p-0" scope="col">
        <div class="d-flex justify-content-between">
          <button type="button" class="sort-btn btn btn-secondary flex-grow-1 text-start text-nowrap rounded-0 fw-bold">
            ${column.title}
            <i class="sort-icon bi px-1 d-inline-block" style="width:16px;height:16px"></i>
          </button>
          <button type="button" class="filter-btn btn btn-secondary rounded-0 mx-1 fw-bold">
            <i class="filter-icon bi bi-filter px-1" style="cursor: pointer;"></i>
          </button>
        </div>
       </th>`,
    );

    header_el.addEventListener("click", (event) => this.on_table_header_click(event, column));

    const filter_btn = header_el.querySelector(".filter-btn")
    filter_btn.addEventListener("click", (event) => {
      event.stopPropagation();
      this.#filter_modal.open(column);
    });

    return header_el;
  }

  /**
   * Extends parent method
   */
  create_placeholder_element() {
    const table_el = CN_element.create(`<table class="table table-striped"><tbody name="body"></tbody></table>`);

    for (let row = 0; row < 20; row++) {
      let tr_el = document.createElement("tr");
      for (let col = 0; col < 4; col++) {
        let width = Math.ceil(Math.random() * 6) + 6;
        tr_el.innerHTML += `
          <td class="text-center placeholder-glow">
            <span class="placeholder placeholder-lg bg-dark bg-opacity-50 col-${width}"></span>
          </td>
        `;
      }
      table_el.querySelector("tbody").append(tr_el);
    }

    return table_el;
  }

  /**
   * Extends parent method
   */
  create_footer_element() {
    const footer_el = CN_element.create('<div class="d-flex align-items-center justify-content-between"></div>');

    const btn_group_el = CN_element.create('<div class="btn-group" role="group"></div>');
    footer_el.append(btn_group_el);

    const summary_el = CN_element.create('<div name="summary" class="text-center fs-6">Loading...</div>');
    footer_el.append(summary_el);

    footer_el.append(CN_element.create(`
      <nav aria-label="${CN_common.uc_words(this.get_model().get_singular())} List navigation">
        <ul name="pagination" class="pagination mb-0"></ul>
      </nav>
    `));

    return footer_el;
  }
}
