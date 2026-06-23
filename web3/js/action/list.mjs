import { CN_api } from "../api.mjs"
import { CN_base_action } from "./base_action.mjs"
import { CN_common } from "../common.mjs"
import { CN_modal_column_filter } from "../modal/column_filter.mjs"
import { CN_modal_confirm } from "../modal/confirm.mjs"
import { CN_modal_message } from "../modal/message.mjs"
import { CN_session } from "../session.mjs"

export class CN_action_list extends CN_base_action {
  #list_mode;
  #columns;
  #records = [];
  #total_records = null;
  #current_page = 1;
  #is_choosing = false;
  #choose_list = {};
  #valid_type_list = [
    "boolean", "date", "datetime", "datetimesecond", "dob", "dod", "email",
    "float", "integer", "rank", "size", "string", "text", "time"
  ];

  /**
   * Constructor
   * TODO: document a full description of the columns parameter
   * @param base_model model: The model that the list action belongs to
   */
  constructor(parent_el, model, override_type = null) {
    super(null == override_type ? "list" : override_type, parent_el, model);

    // we don't want a delay when showing the placeholder
    this.set_placeholder_show_delay(0);

    // determine whether the list is in choosing mode
    const parent_model = this.get_model().get_parent_model();
    this.#list_mode = (
      null != parent_model && parent_model.get_module().has_choose(model.get_name()) ?
      "choose" :
      "add"
    );

    this.#columns = model.clone_columns();
    for (const col_name in this.#columns) {
      const column = this.#columns[col_name];

      // define column default properties
      column.name = col_name;
      if (!column.type) column.type = "string";
      if (undefined === column.table_prefix) column.table_prefix = true;
      if (undefined === column.align) column.align = "left";

      // make sure the column type is valid
      if (!this.#valid_type_list.includes(column.type)) {
        throw new Error(`
          Column "${col_name}" in model ${model.get_name()}
          has invalid type "${column.type}",
          must be one of the following: ${this.#valid_type_list.join(", ")}
        `);
      }

      // determine the column's full name
      column.table_name = model.get_name();
      column.column_name = col_name;
      if (column.column) {
        // make sure column is table_name.column_name
        if (null == column.column.match(/^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/)) {
          throw new Error(`
            Column "${col_name}" in model ${model.get_name()}
            has invalid column property "${column.column}",
            must be in the form "table.column"
          `);
        }
        [column.table_name, column.column_name] = column.column.split(".");
      }

      // define the is_hidden function if it hasn't been defined
      if (!CN_common.is_function(column.is_hidden)) {
        column.is_hidden = (model) => {
          // if there's a parent then don't show columns belonging to the parent's name
          const parent_model = model.get_parent_model();
          return null != parent_model && parent_model.get_name() == column.table_name;
        };
      }
    }

    // now read the query parameters
    this.read_query_parameters();
  }

  // access methods
  is_choosing() { return this.#is_choosing; }

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
   * Updates the query parameters with the current table configuration
   * The tables parameter has the following form: {
   *   <table_name>: {
   *     page: the current page number
   *     order: null or [{}] or { column }
   *     columns: {
   *       <column_name>: [{
   *         operator: =|!=|<|>|LIKE|NOT LIKE|etc,
   *         value: the value to compare to,
   *         or: true when logically ORing the comparison (optional)
   *       )],
   *     }
   *   }
   * }
   */
  read_query_parameters() {
    // Get any table configurations from from URL query parameters
    const model = this.get_model();
    const name = model.get_name();
    const tables = JSON.parse(this.get_query_parameter("tables"));
    const table = CN_common.is_object(tables) && CN_common.is_object(tables[name]) ? tables[name] : {};
    this.#current_page = table.page ? table.page : 1;
    if (!table.order) table.order = model.get_default_order();

    for (const col_name in this.#columns) {
      const column = this.#columns[col_name];

      column.order = (
        table.order && col_name == table.order.column ?
        table.order.desc :
        null
      );

      // define this column's initial condition_list based on the table config
      column.condition_list = (
        table.columns && table.columns[col_name] ?
        CN_api.lengthen_modifier(table.columns[col_name]) :
        []
      );
    }
  }

  /**
   * ADD DOCS
   */
  write_query_parameters() {
    const model = this.get_model();
    const name = model.get_name();
    const default_order = model.get_default_order();
    let tables = JSON.parse(this.get_query_parameter("tables"));
    let table = CN_common.is_object(tables) && tables[name] ? tables[name] : {};

    // set the page argument
    if (1 == this.#current_page) {
      if (table.page) delete table.page;
    } else {
      table.page = this.#current_page;

      // add the table if it doesn't exist
      if (!CN_common.is_object(tables)) tables = {};
      if (!CN_common.is_object(tables[name])) tables[name] = table;
    }

    let order = null;
    const columns = {};
    for (const col_name in this.#columns) {
      const column = this.#columns[col_name];
      if (null != column.order) {
        order = {
          column: column.name,
          desc: column.order,
        };
      }
      if (0 < column.condition_list.length) {
        columns[col_name] = column.condition_list;
      }
    }

    // don't write the order if it is the same as the default
    if (null != order && default_order.column == order.column && default_order.desc == order.desc) order = null;

    // setup the order argument
    if (null == order) {
      // remove the order property if it exists
      if (table.order) delete table.order;
    } else {
      table.order = order;

      // add the table if it doesn't exist
      if (!CN_common.is_object(tables)) tables = {};
      if (!CN_common.is_object(tables[name])) tables[name] = table;
    }

    // setup the columns argument
    if (0 == Object.keys(columns).length) {
      // remove the order property if it exists
      if (null != table && table.columns) delete table.columns;
    } else {
      table.columns = columns;

      // add the table if it doesn't exist
      if (!CN_common.is_object(tables)) tables = {};
      if (!CN_common.is_object(tables[name])) tables[name] = table;
    }

    // if empty, remove the table from the tables parameter
    if (CN_common.is_object(tables)) {
      if (0 == Object.keys(table)) delete tables[name];

      // if empty, remove the tables parameter
      if (0 == Object.keys(tables)) tables = null;
    }


    this.set_query_parameter("tables", null == tables ? null : JSON.stringify(tables));
  }

  /**
   * Returns whether any of the list's columns has any conditions
   * @return boolean
   */
  has_column_filters() {
    for (const col_name in this.#columns) {
      if (0 < this.#columns[col_name].condition_list.length) return true;
    }
    return false;
  }

  /**
   * Returns the record count
   * @return integer
   */
  get_record_count() {
    return this.#total_records;
  }

  /**
   * Returns the formatted record count (eg: [num] followed by * if the table is filtered)
   * @return string
   */
  get_formatted_record_count() {
    return (
      `[${null === this.#total_records ? "..." : this.#total_records}]` +
      (this.has_column_filters() ? "*" : "")
    );
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
    const modal = new CN_modal_confirm({
      title: "Please Confirm",
      message: `Are you sure you wish to delete the ${this.get_model().get_singular()} record?`,
    });

    if (await modal.open()) {
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
      const params = {
        add: Object.keys(this.#choose_list).reduce((list, id) => {
          if ("add" == this.#choose_list[id]) list.push(Number(id));
          return list;
        }, []),
        remove: Object.keys(this.#choose_list).reduce((list, id) => {
          if ("remove" == this.#choose_list[id]) list.push(Number(id));
          return list;
        }, []),
      };
      if (0 == params.add.length) delete params.add;
      if (0 == params.remove.length) delete params.remove;
      if (params.add || params.remove) {
        await CN_api.post(this.get_model().get_base_path("api"), params);
      }
    }

    // toggle the is_choosing state
    this.#choose_list = {};
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
   * Override the parent method
   */
  get_on_load_path() {
    return this.get_model().get_base_path("api");
  }

  /**
   * Extend the parent method
   */
  get_on_load_parameters() {
    const model = this.get_model();

    let params = {
      modifier: {
        limit: CN_session.get("application", "list_row_size"),
        offset: (this.#current_page - 1) * 20,
        where: []
      },
      select: { column: [] },
    };

    // set the query's limit and offset based on the current page
    if (this.#is_choosing) params.choosing = 1;

    for (const col_name in this.#columns) {
      const column = this.#columns[col_name];
      if (column.column || column.table_prefix) {
        params.select.column.push({ table: column.table_name, column: column.column_name, alias: col_name });
      } else {
        // no table prefix means just add the column name
        params.select.column.push(column.column_name);
      }

      const full_column_name = (
        column.table_prefix ?
        [column.table_name, column.column_name].join(".") :
        column.column_name
      );

      // apply the order
      if (null != column.order) {
        if (true === column.order) {
          params.modifier.order = {};
          params.modifier.order[full_column_name] = true;
        } else {
          params.modifier.order = full_column_name;
        }
      }

      // convert the column's condition list into where statements
      if (1 < column.condition_list.length) params.modifier.where.push({ bracket: true, open: true });

      params.modifier.where = [
        ...params.modifier.where,
        ...column.condition_list.map(condition => {
          const where = {
            // use the column definition if there is one
            ...{ column: column.column ? column.column : full_column_name },
            ...condition
          };

          // setup LIKE operations
          if (["LIKE", "NOT LIKE"].includes(where.operator)) {
            if (0 == where.value.length) {
              // LIKE "" is meaningless, so search for <=> "" instead
              where.operator = "<=>";
            } else if (!where.value.includes("%")) {
              // LIKE without % is meaningless, so enclose the value in %
              where.value = `%${where.value}%`;
            }
          }

          return where;
        }),
      ];

      if (1 < column.condition_list.length) params.modifier.where.push({ bracket: true, open: false });
    }

    return params;
  }

  /**
   * Extends parent method
   */
  async on_load() {
    await super.on_load();
    const response = await CN_api.get(this.get_on_load_path(), this.get_on_load_parameters(), true);

    this.#total_records = Number(response.headers.get("X-Total"));
    const filters = this.has_column_filters();

    // replace the records at the current page with the returned records
    this.#records = await response.json();

    // when in choose mode, update record chosen state based on the choose list
    if (this.#is_choosing) {
      this.#records.filter(record => this.#choose_list[record.id]).forEach(record => {
        record.chosen = "add" == this.chooseList[record.id];
      });
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
   * ADD DOCS
   */
  async set_page(page) {
    this.#current_page = page;

    this.write_query_parameters();
    await this.run();
  }

  /**
   * Updates the sort that is applied to a column and updates the table.
   * Iterates through No sort -> ascending -> descending
   * and updates the query parameters and column state.
   * @param {*} column
   */
  async on_sort_column(column) {
    for (const col_name in this.#columns) {
      if (col_name == column.name) {
        const order = this.#columns[col_name].order;
        this.#columns[col_name].order = (
          null === order ?
          false :
          false === order ?
          true :
          null
        );
      } else {
        // do not sort any other column
        this.#columns[col_name].order = null;
      }
    }

    this.write_query_parameters();
    await this.run();
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

      // now track whether the record will be added or removed once applied
      if (this.#choose_list[record.id]) {
        // we're already altering the choose state, so remove that change if necessary
        if (
          (record.chosen && "remove" == this.#choose_list[record.id]) ||
          (!record.chosen && "add" == this.#choose_list[record.id])
        ) {
          delete this.#choose_list[record.id];
        }
      } else {
        // note which way we'll be changing the choose state
        this.#choose_list[record.id] = record.chosen ? "add" : "remove";
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

    const model = this.get_model();
    const parent_model = model.get_parent_model();
    const body_el = this.get_body_element();
    const footer_el = this.get_footer_element();

    // update the parent's child list record count
    if (parent_model && "view" == parent_model.get_action_name()) {
      const child_lists_el = parent_model.get_element().querySelector("div[name=child-lists]");
      if (child_lists_el) {
        const btn_el = child_lists_el.querySelector(`button[name=${model.get_name()}]`);
        if (btn_el) {
          btn_el.innerHTML = btn_el.innerHTML.replace(/ \[[0-9.]+\].*/, ` ${this.get_formatted_record_count()}`);
        }
      }
    }

    // set the column sort and filter icons
    for (const col_name in this.#columns) {
      const column = this.#columns[col_name];
      const th_el = body_el.querySelector(`th[name=${column.name}]`);

      if (th_el) {
        const sort_icon_el = th_el.querySelector("i[name=sort-icon]");
        sort_icon_el.classList.remove("bi-sort-up");
        sort_icon_el.classList.remove("bi-sort-down");
        if (null != column.order) {
          sort_icon_el.classList.add(column.order ? "bi-sort-up" : "bi-sort-down");
        }

        const filter_icon_el = th_el.querySelector("i[name=filter-icon]");
        if (0 < column.condition_list.length) {
          filter_icon_el.classList.remove("bi-filter")
          filter_icon_el.classList.add("bi-filter-circle-fill")
        } else {
          filter_icon_el.classList.remove("bi-filter-circle-fill")
          filter_icon_el.classList.add("bi-filter")
        }
      }
    }

    const btn_group_el = footer_el.querySelector("div.btn-group");
    let btn_el = footer_el.querySelector(`[name=${this.#list_mode}]`);

    if ("add" == this.#list_mode) {
      // if we have no add button and adding is allowed then create it
      if (null == btn_el && model.allow_add()) {
        btn_el = this.constructor.html('<button name="add" type="button" class="btn btn-primary"></button>');
        btn_group_el.append(btn_el);
        (async () => { btn_el.innerHTML = await this.get_text("add"); })();
        btn_el.addEventListener("click", this.on_add.bind(this));
      } else if (null != btn_el && !model.allow_add()) {
        // if we have an add button but adding isn't allowed then remove it
        btn_group_el.removeChild(btn_el);
      }
    } else if ("choose" == this.#list_mode) {
      // if choosing is allowed then create the choose button (if needed) and configure it
      if (model.allow_choose()) {
        if (null == btn_el) {
          btn_el = this.constructor.html('<button name="choose" type="button" class="btn btn-primary"></button>');
          btn_group_el.append(btn_el);
          btn_el.addEventListener("click", this.on_choose.bind(this));
        }

        let cancel_btn_el = footer_el.querySelector("button[name=cancel-choose]");
        if (this.#is_choosing) {
          // we're currently choosing records
          btn_el.innerHTML = "Apply";

          // create the cancel button if it doesn't exist
          if (null == cancel_btn_el) {
            cancel_btn_el = this.constructor.html(
              '<button name="cancel-choose" type="button" class="btn btn-outline-primary">Cancel</button>'
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

    const tbody_el = body_el.querySelector("tbody");
    tbody_el.innerHTML = "";

    const cursor = model.allow_view() ? 'style="cursor: grab"' : "";
    if (0 == this.#records.length) {
      let tr_el = this.constructor.html(`
        <tr>
          <td colspan="100%" class="text-center">There are no ${this.get_model().get_plural()} found.</td>
        </tr>
      `);
      tbody_el.append(tr_el);
    } else {
      const visible_columns = Object.keys(this.#columns).filter(c => !this.#columns[c].is_hidden(model));
      const last_col_name = 0 == visible_columns.length ? null : visible_columns[visible_columns.length-1];

      const last_column_el = body_el.querySelector("thead th:last-child div.d-flex");
      if (last_column_el) {
        if ("choose" != this.#list_mode && model.allow_delete()) {
          last_column_el.classList.add("pe-2");
          last_column_el.classList.add("me-5");
        } else {
          last_column_el.classList.remove("pe-2");
          last_column_el.classList.remove("me-5");
        }
      }

      this.#records.map(record => {
        let tr_el = this.constructor.html(`<tr ${cursor}></tr>`);
        if (this.#is_choosing) {
          if (record.chosen) tr_el.classList.add("table-primary");
          if (this.is_choose_disabled(record)) tr_el.style.cursor = "not-allowed";
        }
        tr_el.addEventListener("click", this.on_row_click.bind(this, record));

        visible_columns.forEach(col_name => {
          const column = this.#columns[col_name];

          let value = record[col_name];
          if (null === value) {
            value = "(empty)";
          } else if ("boolean" == column.type) {
            value = value ? "Yes" : "No";
          } else if (["string", "text"].includes(column.type) && column.html) {
            // escape HTML as a plain-text string (leveraging the <option> element to convert HTML to string)
            value = (new Option(value)).innerHTML
          } else if ("size" == column.type) {
            value = CN_common.format_filesize(value);
          } else if (CN_common.is_datetime_type(column.type, "date")) {
            value = CN_common.format_datetime(value, column.type);
          } else if ("rank" == column.type) {
            value = CN_common.ordinal_suffix(value);
          } else if (CN_common.is_datetime_type(column.type, "time")) {
            value = CN_common.format_time(
              CN_common.is_string(value) ?
              new Date(`${CN_common.format_datetime(new Date(), "date")} ${value}`) :
              value
            );
          } else if (CN_common.is_string(value) && 0 < column.limit) {
            if (value.length > column.limit) {
              value = value.substring(0, column.limit) + " ...";
            }
          }

          if (last_col_name == col_name && "choose" != this.#list_mode && model.allow_delete()) {
            tr_el.innerHTML += `
              <td class="text-${column.align} text-truncate border border-light border-2 px-3">
                <div class="d-flex">
                  <div class="w-100">${value}</div>
                  <div class="flex-shrink-1">
                    <button name="delete" class="btn btn-sm btn-danger">
                      <i class="bi bi-x-circle-fill"></i>
                    </button>
                  </div>
                </div>
              </td>
            `;
            tr_el.querySelector("button[name=delete]").addEventListener("click", (e) => {
              e.stopPropagation();
              this.on_delete(record);
            });
          } else {
            tr_el.innerHTML += `
              <td class="text-${column.align} text-truncate border border-light border-2 px-3">
                ${value}
              </td>
            `;
          }
        });

        // remove the outer most white borders
        const td_el_list = tr_el.querySelectorAll("td");
        const len = td_el_list.length;
        if (0 < len) {
          td_el_list[0].classList.add("border-start-0");
          td_el_list[len-1].classList.add("border-end-0");
        }

        tbody_el.append(tr_el);
      });
    }

    if (null == this.#total_records) {
      footer_el.querySelector("div[name=summary]").innerHTML = "Loading...";
    } else {
      footer_el.querySelector("div[name=summary]").innerHTML = [
        this.#total_records,
        1 == this.#total_records ? model.get_singular() : model.get_plural(),
        "total",
        this.has_column_filters() ? "(filtered)" : "",
      ].join(" ");
    }

    // rebuild the pagination buttons
    const pagination_el = footer_el.querySelector("ul.pagination");
    pagination_el.innerHTML = "";

    const pages = Math.ceil(this.#total_records / CN_session.get("application", "list_row_size"));

    if (1 < pages) {
      // add the previous button
      const prev_el = this.constructor.html(`
        <li class="page-item"><button class="page-link"><i class="bi bi-rewind-fill"></i></button></li>
      `);
      if (1 == this.#current_page) this.constructor.set_disabled(prev_el, true);
      pagination_el.append(prev_el);
      prev_el.querySelector("button").addEventListener("click", async () => {
        if (1 != this.#current_page) await this.set_page(1);
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
        let page_el = this.constructor.html(`
          <li class="page-item"><button class="page-link">${page}</button></li>
        `);
        if (page == this.#current_page) page_el.classList.add("active");
        pagination_el.append(page_el);
        page_el.querySelector("button").addEventListener("click", async () => {
          if (page != this.#current_page) await this.set_page(page);
        });
      }

      // add the next button
      const next_el = this.constructor.html(`
        <li class="page-item"><button class="page-link"><i class="bi bi-fast-forward-fill"></i></button></li>
      `);
      if (pages == this.#current_page) this.constructor.set_disabled(next_el, true);
      pagination_el.append(next_el);
      next_el.querySelector("button").addEventListener("click", async () => {
        if (pages != this.#current_page) await this.set_page(pages);
      });
    }
  }

  /**
   * Creates the table header element and adds listeners to the filter buttons that belong to each header
   * @param {*} column
   * @returns
   */
  create_table_header_element(column, placeholder = false) {
    const help = (
      column.help ?
      `<i
        class="bi bi-info-circle-fill"
        data-bs-toggle="tooltip"
        data-bs-html="true"
        data-bs-title="${column.help.replace(/"/g, "&quot;")}"
      ></i>` :
      ""
    );
    const filter_icon = 0 < column.condition_list.length ? "bi-filter-circle-fill" : "bi-filter";
    const header_el = this.constructor.html(`
      <th name="${column.name}" class="border border-light border-2 border-top-0 p-0" scope="col">
        <div class="d-flex">
          <button
            type="button"
            name="sort-button"
            class="btn btn-secondary flex-grow-1 text-start text-nowrap rounded-0 fw-bold px-3"
          >
            ${help}
            ${column.title}
            <i name="sort-icon" class="bi d-inline-block"></i>
          </button>
          <button type="button" name="filter-button" class="btn btn-secondary rounded-0 fw-bold">
            <i name="filter-icon" class="bi ${filter_icon}"></i>
          </button>
        </div>
      </th>
    `);
    const filter_btn = header_el.querySelector("button[name=filter-button]")

    if (column.help) new bootstrap.Tooltip(header_el.querySelector(".bi-info-circle-fill"));

    if (!placeholder) {
      header_el.addEventListener("click", this.on_sort_column.bind(this, column));
      filter_btn.addEventListener("click", async (event) => {
        event.stopPropagation();
        const response = await CN_modal_column_filter.create_and_open({
          table: CN_common.uc_words(this.get_model().get_singular()),
          column: column,
          model: this.get_model(),
        });
        if (response) {
          column.condition_list = response;
          this.write_query_parameters();
          await this.run();
        }
      });
    }

    return header_el;
  }

  /**
   * Extends parent method
   */
  _create_header_element() {
    const header_el = super._create_header_element();

    const report_div_el = this.constructor.html(`
      <div class="dropdown" name="report">
        <button name="report" type="button" class="btn btn-primary px-2 py-0" data-bs-toggle="dropdown">
          <i class="bi bi-cloud-download fs-5"></i>
        </button>
        <ul class="dropdown-menu bg-secondary">
          <li>
            <div class="dropdown-header text-bg-secondary">Download List Data</div>
          </li>
          <li class="bg-body">
            <button name="csv" class="dropdown-item" href="#">Comma Separated Values (.csv)</button>
          </li>
          <li class="bg-body">
            <button name="xlsx" class="dropdown-item" href="#">Microsoft Excel (.xlsx)</button>
          </li>
          <li class="bg-body">
            <button name="ods" class="dropdown-item" href="#">OpenDocument Spreadsheet (.ods)</button>
          </li>
        </ul>
      </div>
    `);

    new bootstrap.Tooltip(report_div_el, {
      title: "Download list",
      trigger: "hover",
      delay: { "show": 1000, "hide": 100 },
    });

    ["csv", "xlsx", "ods"].forEach(format => {
      report_div_el.querySelector(`button[name=${format}]`).addEventListener("click", async () => {
        if (!this.get_model().allow_report()) {
          await CN_modal_message.create_and_open({
            header_class: "text-bg-danger",
            title: "Error",
            message: "You cannot download data from this list.",
          });
        } else if (this.#total_records > CN_session.get("application", "max_big_report")) {
          await CN_modal_message.create_and_open({
            header_class: "text-bg-danger",
            title: "Error",
            message: "The list has too many rows to download.",
          });
        } else if ("csv" != format && this.#total_records > CN_session.get("application", "max_small_report")) {
          await CN_modal_message.create_and_open({
            header_class: "text-bg-danger",
            title: "Error",
            message: "The list can only be downloaded as a CSV file.",
          });
        } else {
          const model = this.get_model();
          const parent_model = model.get_parent_model();
          const params = this.get_on_load_parameters();
          params.modifier.limit = CN_session.get("application", "max_big_report");
          delete params.modifier.offset;
          const response = await CN_api.file(this.get_on_load_path(), format, params, true);
          CN_common.download_file(
            await response.blob(),
            response.headers.get("content-disposition").match(/filename=(.*);/)[1],
          );
        }
      });
    });
    header_el.querySelector("button[name=refresh]").before(report_div_el);

    return header_el;
  }

  /**
   * Extends parent method
   */
  _create_body_element() {
    if (this.#columns.length <= 0) throw new Error("Number of table columns must be > 0");

    const model = this.get_model();

    const table_el = this.constructor.html(`
      <div class="table-responsive">
        <table class="table table-striped ${model.allow_view() ? "table-hover" : ""} m-0">
          <thead></thead>
          <tbody></tbody>
        </table>
      </div>
    `);

    // build the header row
    let header_tr_el = this.constructor.html("<tr></tr>");

    const visible_columns = Object.keys(this.#columns).filter(c => !this.#columns[c].is_hidden(model));
    visible_columns.forEach(col_name => {
      const th_el = this.create_table_header_element(this.#columns[col_name]);
      header_tr_el.append(th_el);
    });

    // remove the outer most white borders
    const th_el_list = header_tr_el.querySelectorAll("th");
    const len = th_el_list.length;
    if (0 < len) {
      th_el_list[0].classList.add("border-start-0");
      th_el_list[len-1].classList.add("border-end-0");
    }

    table_el.querySelector("thead").append(header_tr_el);
    return table_el;
  }

  /**
   * Extends parent method
   */
  _create_placeholder_element() {
    const table_el = this.constructor.html(`
      <div class="table-responsive">
        <table class="table table-striped m-0">
          <thead name="header"></thead>
          <tbody name="body"></tbody>
        </table>
      </div>
    `);

    // build the header row
    let header_tr_el = this.constructor.html("<tr></tr>");

    for (const col_name in this.#columns) {
      const column = this.#columns[col_name];
      if (!column.is_hidden(this.get_model())) {
        header_tr_el.append(this.create_table_header_element(column, true));
      }
    }

    // remove the outer most white borders
    const th_el_list = header_tr_el.querySelectorAll("th");
    const len = th_el_list.length;
    if (0 < len) {
      th_el_list[0].classList.add("border-start-0");
      th_el_list[len-1].classList.add("border-end-0");
    }

    table_el.querySelector("thead").append(header_tr_el);

    return table_el;
  }

  /**
   * Extends parent method
   */
  show_placeholder() {
    // update how many rows the placeholder has based on the existing data (minimum 1)
    const total_rows = null == this.#total_records ? 20 : 0 == this.#total_records ? 1 : this.#records.length;

    const tbody_el = this.get_placeholder_element().querySelector("tbody");
    tbody_el.innerHTML = "";
    for (let row = 0; row < total_rows; row++) {
      const td_list = [];
      for (const col_name in this.#columns) {
        const column = this.#columns[col_name];
        td_list.push(`
          <td
            class="text-${column.align} border border-light border-2 px-3 placeholder-glow"
            style="line-height: 30.6px;"
          >
            <span
              class="
                placeholder
                placeholder-lg
                bg-dark
                bg-opacity-50
                col-${Math.ceil(Math.random() * 5) + 5}
              "
            ></span>
          </td>
        `);
      }
      tbody_el.append(this.constructor.html(`<tr>${td_list.join()}</tr>`));
    }

    super.show_placeholder();
  }

  /**
   * Extends parent method
   */
  _create_footer_element() {
    const footer_el = this.constructor.html(
      '<div class="d-flex align-items-center justify-content-between"></div>'
    );

    footer_el.append(this.constructor.html(`
      <nav
        aria-label="${CN_common.encode_html(CN_common.uc_words(this.get_model().get_singular()))} List navigation"
      >
        <ul name="pagination" class="pagination mb-0"></ul>
      </nav>
    `));

    footer_el.append(this.constructor.html('<div name="summary" class="text-center fs-6">Loading...</div>'));
    footer_el.append(this.constructor.html('<div class="btn-group" role="group"></div>'));

    return footer_el;
  }

  /**
   * Extends parent method
   */
  _create_element() {
    const el = super._create_element();
    el.querySelector("div.card-body").classList.add("p-0");
    return el;
  }
}
