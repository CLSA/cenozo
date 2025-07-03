import CN_api from "./api.mjs"
import CN_common from "./common.mjs"
import CN_element from "./element.mjs"
import CN_session from "./session.mjs"

import { CN_base_action } from "./base_action.mjs"

export class CN_base_list extends CN_base_action {
  #list_mode;
  #columns;
  #records = [];
  #total_records = 0;
  #current_page = 1;
  #is_choosing = false;
  #choosing_list;

  /**
   * Constructor
   *
   * TODO: document a full description of the columns parameter
   *
   * @param base_model parent_model: The model that the list action belongs to
   * @param object columns: A list of column definitions
   */
  constructor(parent_model, columns) {
    super("list", parent_model);

    // determine whether the list is in choosing mode
    const parent_module = parent_model.get_parent_module();
    this.#list_mode = (
      null != parent_module && parent_module.has_choose(parent_model.get_name()) ?
      "choose" :
      "add"
    );

    // setup each column
    this.#columns = CN_common.clone(columns);
    for (var col_name in this.#columns) {
      const column = this.#columns[col_name];
      if (!column.type) column.type = "string";

      // by default always prefix the table name
      if (undefined === column.table_prefix) column.table_prefix = true;

      // by default center align all columns except for text columns
      if (undefined === column.align) column.align = "text" == column.type ? "left" : "center";

      // define the is_hidden function if it hasn't been defined
      if (!CN_common.is_function(column.is_hidden)) {
        column.is_hidden = () => {
          if (!column.column) return false;

          // if there's a parent then don't show columns belonging to the parent's name
          return null != parent_module && column.column.match(`${parent_module.get_name()}\.`);
        };
      }
    }
  }

  // access methods
  is_choosing() { return this.#is_choosing; }

  /**
   * Extends the parent method
   */
  async get_text(type) {
    if ("header" == type) {
      return `${CN_common.uc_words(this.get_parent_model().get_singular())} List`;
    }

    if ("add" == type) {
      return `Add ${CN_common.uc_words(this.get_parent_model().get_singular())}`;
    }

    if ("choose" == type) {
      return `Choose ${CN_common.uc_words(this.get_parent_model().get_plural())}`;
    }

    return await super.get_text(type);
  }

  /**
   * Called when the list's add button is clicked
   */
  async on_add() {
    await CN_session.navigate_to(this.get_parent_model().get_add_url());
  }

  /**
   * Called when one of the list's delete buttons are clicked
   * @param object record: One of the records from the #records array
   */
  async on_delete(record) {
    // first confirm
    const modal = CN_element.modal_confirm({
      static: true,
      title: "Please Confirm",
      message: `
        Are you sure you wish to delete the ${this.get_parent_model().get_singular()} record?
      `,
    });

    if (await modal.test()) {
      await CN_api.delete(`${this.get_parent_model().get_name()}/${record.id}`);
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
        const response = await CN_api.post(this.get_parent_model().get_base_path("api"), params);
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
   * Extends parent method
   */
  async on_load() {
    // set the query's limit and offset based on the current page
    const params = {
      modifier: {
        limit: CN_session.data.application.list_row_size,
        offset: (this.#current_page-1) * 20,
      },
      select: { column: [] },
    };

    if (this.#is_choosing) params.choosing = 1;

    // run through the columns and build the query's select parameter
    let columns = [];
    for (const col_name in this.#columns) {
      if (this.#columns[col_name].table_prefix) {
        let column = this.#columns[col_name].column;
        if (!column) column = `${this.get_parent_model().get_name()}.${col_name}`;
        let [table, name] = column.split(".");
        params.select.column.push({
          table: table,
          column: name,
          alias: col_name
        });
      } else {
        // no table prefix means just add the column name
        params.select.column.push(col_name);
      }
    }

    const response = await CN_api.get(this.get_parent_model().get_base_path("api"), params);
    const limit = response.headers.get('X-Limit');
    const offset = response.headers.get('X-Offset');
    this.#total_records = response.headers.get('X-Total');

    // replace the records at the current page with the returned records
    this.#records = await response.json();

    if (this.#is_choosing) {
      // make note of chosen records
      this.#choosing_list = {
        current: this.#records.filter(r => r.chosen).map(r => r.id),
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
    for (let row=0; row<20; row++) {
      let tr_el = document.createElement("tr");
      for (const col_name in this.#columns) {
        let col = Math.ceil(Math.random()*6)+6;
        tr_el.innerHTML += `
          <td class="text-center placeholder-glow">
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
    } else if (this.get_parent_model().allow_view()) {
      await CN_session.navigate_to(this.get_parent_model().get_view_url(record.id));
    }
  }

  /**
   * Extends parent method
   */
  update_element() {
    super.update_element();

    if ("choose" == this.#list_mode) {
      // update the choose buttons based on is_choosing
      const btn_el = this.get_element().querySelector("[name=choose]");
      (async () => { btn_el.innerHTML = this.#is_choosing ? "Apply" : await this.get_text("choose"); })();

      // add or remove the cancel button depending on whether we're currently choosing or not
      const cancel_btn_el = this.get_element().querySelector("[name=cancel_choose]");
      if (this.#is_choosing && null == cancel_btn_el) {
        // add the cancel button
        const cancel_btn_el = CN_element.create(
          '<button name="cancel_choose" type="button" class="btn btn-outline-primary">Cancel</button>'
        );
        cancel_btn_el.onclick = async () => await this.on_cancel_choose();
        btn_el.parentElement.prepend(cancel_btn_el);
      } else if (!this.#is_choosing && null != cancel_btn_el) {
        // remove the cancel button
        cancel_btn_el.remove();
      }
    }

    const body_el = this.get_element().querySelector("table [name=body]");
    body_el.innerHTML = "";

    const start_index = (this.#current_page-1)*20;
    this.#records.map(record => {
      let tr_el = document.createElement("tr");
      if (this.#is_choosing) {
        if (record.chosen) tr_el.classList.add("table-primary");
        if (this.is_choose_disabled(record)) tr_el.style.cursor = "not-allowed";
      }
      tr_el.onclick = async () => await this.on_row_click(record);
      for (const col_name in this.#columns) {
        const column = this.#columns[col_name];

        // don't show hidden columns
        if (column.is_hidden(this)) continue;

        let value = record[col_name];
        if (null === value) {
          value = "(empty)";
        } else if ("boolean" == column.type) {
          value = value ? "Yes" : "No";
        } else if (CN_common.is_datetime_type(column.type, "date")) {
          value = CN_common.format_datetime(value, column.type);
        } else if ("rank" == column.type) {
          value = CN_common.ordinal_suffix(value);
        } else if (CN_common.is_datetime_type(column.type, "time")) {
          value = CN_common.format_time(value, column.type);
        } else if (CN_common.is_string(value) && 0 < column.limit) {
          value = value.substring(0, column.limit);
        }

        tr_el.innerHTML += `<td class="text-${column.align}">${value}</td>`;
      }

      // add an empty header for deleting records
      if (this.get_parent_model().allow_delete()) {
        tr_el.innerHTML += `
          <td class="col-auto p-0">
            <button name="delete" class="btn btn-danger"><i class="bi-x-circle-fill"></i></button>
          </td>
        `;

        tr_el.querySelector("[name=delete]").onclick = () => {
          this.on_delete(record);
        };
      }

      body_el.append(tr_el);
    });

    const summary_el = this.get_element().querySelector(".card-footer [name=summary]");
    summary_el.innerHTML = `${this.#total_records} ${this.get_parent_model().get_plural()} total`;

    // rebuild the pagination buttons
    const pagination_el = this.get_element().querySelector(".card-footer ul.pagination");
    pagination_el.innerHTML = "";

    const pages = Math.ceil(this.#total_records / CN_session.data.application.list_row_size);

    if (1 < pages) {
      // add the previous button
      const prev_el = CN_element.create(`
        <li class="page-item"><button class="page-link"><i class="bi-rewind-fill"></i></button></li>
      `);
      if (1 == this.#current_page) prev_el.classList.add("disabled");
      pagination_el.append(prev_el);
      prev_el.querySelector("button").onclick = () => {
        if (1 != this.#current_page) {
          this.#current_page = 1;
          this.run();
        }
      };

      // add pages by number
      // start by assuming we're at the start of the list
      let first_page = 1;
      let last_page = 5 < pages ? 5 : pages;

      if (pages > 5) {
        if (pages-2 < this.#current_page) {
          // we're at the end of the list, so show the last 5 pages
          first_page = pages-4;
          last_page = pages;
        } else if (3 < this.#current_page) {
          // we're in the middle of the list, so put the current page in the middle of the page span
          // the first page is now two less than the current page
          first_page = this.#current_page-2;

          // and the last page is at most to more than the current page
          last_page = this.#current_page+2 > pages ? pages : this.#current_page+2;
        }
      }

      for(let page = first_page; page <= last_page; page++) {
        let page_el = CN_element.create(`
          <li class="page-item"><button class="page-link">${page}</button></li>
        `);
        if (page == this.#current_page) page_el.classList.add("active");
        pagination_el.append(page_el);
        page_el.querySelector("button").onclick = () => {
          if (page != this.#current_page) {
            this.#current_page = page;
            this.run();
          }
        };
      }

      // add the next button
      const next_el = CN_element.create(`
        <li class="page-item"><button class="page-link"><i class="bi-fast-forward-fill"></i></button></li>
      `);
      if (pages == this.#current_page) next_el.classList.add("disabled");
      pagination_el.append(next_el);
      next_el.querySelector("button").onclick = () => {
        if (pages != this.#current_page) {
          this.#current_page = pages;
          this.run();
        }
      };
    }
  }

  /**
   * Extends parent method
   */
  create_body_element() {
    const table_el = CN_element.create(`
      <table class="table table-striped table-hover">
        <thead name="header"></thead>
        <tbody name="body"></tbody>
        <tfoot name="footer"></tfooter>
      </table>
    `);

    // build the header row
    let header_tr_el = document.createElement("tr");
    for (const col_name in this.#columns) {
      const column = this.#columns[col_name];

      // don't show hidden columns
      if (column.is_hidden(this)) continue;

      header_tr_el.innerHTML += `<th name="${col_name}" scope="col" class="text-center">${column.title}</th>`;
    }

    // add an empty header for deleting records
    if (this.get_parent_model().allow_delete()) {
      header_tr_el.innerHTML += `<th name="delete" class="col-auto p-0" style="width: 0;" scope="col"></th>`;
    }

    table_el.querySelector("thead[name=header]").append(header_tr_el);

    return table_el;
  }

  /**
   * Extends parent method
   */
  create_footer_element() {
    const footer_el = CN_element.create('<div class="d-flex align-items-center justify-content-between"></div>');

    const btn_group_el = CN_element.create('<div class="btn-group" role="group"></div>');
    footer_el.append(btn_group_el);

    if ("add" != this.#list_mode || this.get_parent_model().get_module().action_allowed("add")) {
      const btn_el = CN_element.create(
        `<button name="${this.#list_mode}" type="button" class="btn btn-primary"></button>`
      );
      btn_group_el.append(btn_el);
      (async () => { btn_el.innerHTML = await this.get_text(this.#list_mode); })();
      btn_el.onclick = async () => await ("choose" == this.#list_mode ? this.on_choose() : this.on_add());
    }

    const summary_el = CN_element.create('<div name="summary" class="text-center fs-6">Loading...</div>');
    footer_el.append(summary_el);

    footer_el.append(CN_element.create(`
      <nav aria-label="${CN_common.uc_words(this.get_parent_model().get_singular())} List navigation">
        <ul name="pagination" class="pagination mb-0"></ul>
      </nav>
    `));

    return footer_el;
  }
}
