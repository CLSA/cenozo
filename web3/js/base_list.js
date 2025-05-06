import PN_api from "./api.js"
import PN_common from "./common.js"
import PN_element from "./element.js"
import PN_session from "./session.js"

import { PN_base_action } from "./base_action.js"

export class PN_base_list extends PN_base_action {
  #columns;
  #records = [];
  #total_records = 0;
  #current_page = 1;

  // getters and setters
  get columns() { return this.#columns }
  get records() { return this.#records }

  /**
   * ADD DOCS
   */
  constructor(parent_model, columns) {
    super(parent_model);

    // setup each column
    const parent_module = this.parent_model.get_parent_module();
    this.#columns = PN_common.clone(columns);
    for (var col_name in this.#columns) {
      const col = this.#columns[col_name];
      if (!PN_common.is_function(col.is_hidden)) {
        col.is_hidden = () => {
          if (!col.column) return false;

          // if there's a parent then don't show columns belonging to the parent's subject
          return null != parent_module && col.column.match(`${parent_module.subject}\.`);
        };
      }
    }
  }

  /**
   * ADD DOCS
   */
  get_text(type) {
    if ("header" == type) {
      return `${PN_common.uc_words(this.parent_model.name.singular)} List`;
    }

    if ("add" == type) {
      return `Add ${PN_common.uc_words(this.parent_model.name.singular)}`;
    }

    return super.get_text(type);
  }

  /**
   * ADD DOCS
   */
  async on_add() {
    await PN_session.navigate_to(this.parent_model.get_add_url());
  }

  /**
   * ADD DOCS
   */
  async on_load() {
    // set the query's limit and offset based on the current page
    const params = {
      modifier: {
        limit: PN_session.data.application.list_row_size,
        offset: (this.#current_page-1) * 20,
      },
      select: { column: [] },
    };

    // run through the columns and build the query's select parameter
    let columns = [];
    for (const col_name in this.#columns) {
      let column = this.#columns[col_name].column;
      if (!column) column = `${this.parent_model.module.subject}.${col_name}`;
      let [table, name] = column.split(".");
      params.select.column.push({
        table: table,
        column: name,
        alias: col_name
      });
    }

    const response = await PN_api.get(this.parent_model.get_base_path("api"), params);
    const limit = response.headers.get('X-Limit');
    const offset = response.headers.get('X-Offset');
    this.#total_records = response.headers.get('X-Total');

    // replace the records at the current page with the returned records
    this.#records = await response.json();
  }

  /**
   * ADD DOCS
   */
  show_placeholder() {
    super.show_placeholder();

    const body_el = this.element.querySelector("table [name=body]");
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
   * ADD DOCS
   */
  async on_row_click(record) {
    // do nothing if the view action doesn't exist
    if (!this.parent_model.module.actions.view) return;

    await PN_session.navigate_to(this.parent_model.get_view_url(record.id));
  }

  /**
   * ADD DOCS
   */
  update_element() {
    super.update_element();

    const body_el = this.element.querySelector("table [name=body]");
    body_el.innerHTML = "";

    const start_index = (this.#current_page-1)*20;
    this.#records.map(record => {
      let tr_el = document.createElement("tr");
      tr_el.onclick = async () => await this.on_row_click(record);
      for (const col_name in this.#columns) {
        const col = this.#columns[col_name];

        // don't show hidden columns
        if (col.is_hidden(this)) continue;

        let value = record[col_name];
        if (null === value) {
          value = "(empty)";
        } else if ("boolean" == col.type) {
          value = value ? "Yes" : "No";
        } else if (PN_common.is_datetime_type(col.type, "date")) {
          value = moment(value).format(
            PN_common.get_datetime_format(
              col.type,
              PN_session.data.user.am_pm
            )
          );
        } else if (PN_common.is_datetime_type(col.type, "time")) {
          value = moment(`${moment().format("YYYY-MM-DD")} ${value}`).format(
            PN_common.get_time_format(
              col.type,
              PN_session.data.user.am_pm
            )
          );
        }

        tr_el.innerHTML += `<td class="text-center">${value}</td>`;
      }
      body_el.append(tr_el);
    });

    const summary_el = this.element.querySelector(".card-footer [name=summary]");
    summary_el.innerHTML = `${this.#total_records} ${this.parent_model.name.plural} total`;

    // rebuild the pagination buttons
    const pagination_el = this.element.querySelector(".card-footer ul.pagination");
    pagination_el.innerHTML = "";

    const pages = Math.ceil(this.#total_records / PN_session.data.application.list_row_size);

    if (1 < pages) {
      // add the previous button
      const prev_el = PN_element.create(`
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
      for(let page = 1; page <= pages; page++) {
        let page_el = PN_element.create(`
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
      const next_el = PN_element.create(`
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
   * ADD DOCS
   */
  create_body_element() {
    const table_el = PN_element.create(`
      <table class="table table-striped table-hover">
        <thead name="header"></thead>
        <tbody name="body"></tbody>
        <tfoot name="footer"></tfooter>
      </table>
    `);

    // build the header row
    let header_tr = document.createElement("tr");
    for (const col_name in this.#columns) {
      const col = this.#columns[col_name];

      // don't show hidden columns
      if (col.is_hidden(this)) continue;

      header_tr.innerHTML += `<th name="${col_name}" scope="col" class="text-center">${col.title}</th>`;
    }
    table_el.querySelector("thead[name=header]").append(header_tr);

    return table_el;
  }

  /**
   * ADD DOCS
   */
  create_footer_element() {
    const footer_el = PN_element.create('<div class="d-flex align-items-center justify-content-between"></div>');

    const btn_group_el = PN_element.create('<div class="btn-group" role="group"></div>');
    footer_el.append(btn_group_el);

    if (this.parent_model.module.actions.hasOwnProperty('add'))
    {
      const add_btn_el = PN_element.create('<button name="add" type="button" class="btn btn-primary">Add</button>');
      btn_group_el.append(add_btn_el);
      (async () => { add_btn_el.innerHTML = await this.get_text("add"); })();
      add_btn_el.onclick = async () => await this.on_add();
    }

    const summary_el = PN_element.create('<div name="summary" class="text-center fs-6">Loading...</div>');
    footer_el.append(summary_el);

    footer_el.append(PN_element.create(`
      <nav aria-label="${PN_common.uc_words(this.parent_model.name.singular)} List navigation">
        <ul name="pagination" class="pagination mb-0"></ul>
      </nav>
    `));

    return footer_el;
  }
}
