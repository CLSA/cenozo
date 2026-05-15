import { CN_action_view } from "../action/view.mjs"
import { CN_api } from "../api.mjs"
import { CN_base_action } from "../action/base_action.mjs"
import { CN_base_model } from "./base_model.mjs"
import { CN_common } from "../common.mjs"
import { CN_session } from "../session.mjs"

export class CN_model_base_person extends CN_base_model {
  constructor(params) {
    super(params);

    if ("CN_model_base_person" == this.constructor) {
      throw new Error("Abstract class CN_model_base_person can't be instantiated.");
    }
  }

  get_history_url() {
    return [this.get_base_path("url"), "history", this.get_identifier()].join("/");
  }
  get_notes_url() {
    return [this.get_base_path("url"), "notes", this.get_identifier()].join("/");
  }
}

export class CN_view_base_person extends CN_action_view {
  constructor(type, parent_el, model) {
    super(type, parent_el, model);

    if ("CN_view_base_person" == this.constructor) {
      throw new Error("Abstract class CN_view_base_person can't be instantiated.");
    }
  }

  /**
   * Add operation to the footer element
   */
  create_footer_element() {
    const footer_el = super.create_footer_element();
    const left_btn_group_el = footer_el.querySelector("div[name=left-btn-group]")

    // add the notes action
    const notes_btn_el = this.constructor.html(
      '<button name="notes" type="button" class="btn btn-light btn-outline-primary">Notes</button>'
    );
    notes_btn_el.addEventListener(
      "click",
      CN_session.navigate_to.bind(CN_session, this.get_model().get_notes_url()),
    );
    left_btn_group_el.append(notes_btn_el);

    // add the history action
    const history_btn_el = this.constructor.html(
      '<button name="history" type="button" class="btn btn-light btn-outline-primary">History</button>'
    );
    history_btn_el.addEventListener(
      "click",
      CN_session.navigate_to.bind(CN_session, this.get_model().get_history_url()),
    );
    left_btn_group_el.append(history_btn_el);

    // add the timezone action
    const timezone_btn_el = this.constructor.html(
      '<button name="timezone" type="button" class="btn btn-light btn-outline-primary">Use Timezone</button>'
    );
    timezone_btn_el.addEventListener("click", async () => {
      const timezone = {};
      timezone[`${this.get_model().get_name()}_id`] = this.get_model().get_identifier();
      await CN_session.set_timezone(timezone, CN_session.get("user", "am_pm"));
    });
    left_btn_group_el.append(timezone_btn_el);

    return footer_el;
  }
}

export class CN_history_base_person extends CN_base_action {
  #category_list = [];
  #data_list = [];

  /**
   * Constructor
   * @param base_model model: The model that the action belongs to
   */
  constructor(parent_el, model) {
    super("history", parent_el, model);

    if ("CN_base_person_history" == this.constructor) {
      throw new Error("Abstract class CN_base_person_history can't be instantiated.");
    }

    this.set_footer_at_top(true);

    const base_path = this.get_model().get_view_url(null, "api");
    this.#category_list = [{
      subject: "address",
      path: `${base_path}/address`,
      get_data: async function () {
        const rows = await CN_api.get(this.path, {
          select: { column: [
            "create_timestamp",
            "rank",
            "address1",
            "address2",
            "city",
            "postcode",
            "international",
            { table: "region", column: "name", alias: "region" },
            { table: "country", column: "name", alias: "country" },
          ]},
        });
        return rows.map(row => ({
          category: this,
          datetime: row.create_timestamp,
          title: "added rank " + row.rank,
          description: [
            row.address1,
            row.address2,
            `${row.city}, ${row.region}, ${row.country}, ${row.postcode}`,
            row.international ? '(international)' : null,
          ].filter(x => null != x).join("\n"),
        }));
      },
    }, {
      subject: "note",
      path: `${base_path}/note`,
      get_data: async function () {
        const rows = await CN_api.get(this.path, {
          select: { column: [
            "datetime",
            "note",
            { table: "user", column: "first_name", alias: "user_first" },
            { table: "user", column: "last_name", alias: "user_last" },
          ]},
        });
        return rows.map(row => ({
          category: this,
          datetime: row.datetime,
          title: `added by ${row.user_first} ${row.user_last}`,
          description: row.note,
        }));
      },
    }, {
      subject: "phone",
      path: `${base_path}/phone`,
      get_data: async function () {
        const rows = await CN_api.get(this.path, {
          select: { column: [
            "create_timestamp",
            "rank",
            "type",
            "number",
            "international",
          ]},
        });
        return rows.map(row => ({
          category: this,
          datetime: row.create_timestamp,
          title: `added rank ${row.rank}`,
          description: `${row.type}: ${row.number}${row.international ? " (international)" : ""}`,
        }));
      },
    }];

    if ("participant" == this.get_model().get_name()) {
      // add participant-only categories
      this.#category_list = this.#category_list.concat([{
        subject: "alternate",
        path: `${base_path}/alternate`,
        get_data: async function () {
          const rows = await CN_api.get(this.path, {
            select: { column: [
              "create_timestamp",
              "association",
              "alternate_type_list",
              "first_name",
              "last_name",
            ]},
          });
          return rows.map(row => ({
            category: this,
            datetime: row.create_timestamp,
            title: `added ${row.first_name} ${row.last_name}`,
            description:
              `${row.first_name} ${row.last_name} ` +
              `(${row.association ? row.association : "unknown association"})\n` +
              `Current roles: ${row.alternate_type_list ? row.alternate_type_list : "(none)"}`,
          }));
        },
      }, {
        subject: "consent",
        path: `${base_path}/consent`,
        get_data: async function () {
          const rows = await CN_api.get(this.path, {
            select: { column: [
              "datetime",
              "accept",
              "written",
              "note",
              { table: "consent_type", column: "name" },
              { table: "consent_type", column: "description" },
            ]},
          });
          return rows.map(row => ({
            category: this,
            datetime: row.datetime,
            title: `added "${row.name}"`,
            description: row.description + (row.note ? `\nNote: ${row.note}` : ""),
          }));
        },
      }, {
        subject: "event",
        path: `${base_path}/event`,
        get_data: async function () {
          const rows = await CN_api.get(this.path, {
            select: { column: [
              "datetime",
              { table: "event_type", column: "name" },
              { table: "event_type", column: "description" },
            ]},
          });
          return rows.map(row => ({
            category: this,
            datetime: row.datetime,
            title: `added "${row.name}"`,
            description: row.description,
          }));
        },
      }, {
        subject: "form",
        path: `${base_path}/form`,
        get_data: async function () {
          const rows = await CN_api.get(this.path, {
            select: { column: [
              "date",
              { table: "form_type", column: "name" },
              { table: "form_type", column: "description" },
            ]},
          });
          return rows.map(row => ({
            category: this,
            datetime: row.date,
            title: `added "${row.name}"`,
            description: row.description,
          }));
        },
      }, {
        subject: "hold",
        path: `${base_path}/hold`,
        get_data: async function () {
          const rows = await CN_api.get(this.path, {
            select: { column: [
              "datetime",
              { table: "hold_type", column: "name" },
              { table: "hold_type", column: "type" },
              { table: "hold_type", column: "description" },
            ]},
          });
          return rows.map(row => ({
            category: this,
            datetime: row.datetime,
            title: null == row.type ? "removed hold" : `added "${row.type} ${row.name}"`,
            description: null == row.type ? "" : row.description,
          }));
        },
      }, {
        subject: "mail",
        path: `${base_path}/mail`,
        get_data: async function () {
          const rows = await CN_api.get(this.path, {
            select: { column: [
              "sent_datetime",
              "subject",
              "note",
            ]},
          });
          return rows.map(row => ({
            category: this,
            datetime: row.sent_datetime,
            title: `sent "${row.subject}"`,
            description: row.note,
          }));
        },
      }, {
        subject: "proxy",
        path: `${base_path}/proxy`,
        get_data: async function () {
          const rows = await CN_api.get(this.path, {
            select: { column: [
              "datetime",
              { table: "proxy_type", column: "name" },
              { table: "proxy_type", column: "description" },
            ]},
          });
          return rows.map(row => ({
            category: this,
            datetime: row.datetime,
            title: null == row.name ? "removed proxy" : `added proxy "${row.name}"`,
            description: null == row.name ? "" : row.description,
          }));
        },
      }, {
        subject: "trace",
        path: `${base_path}/trace`,
        get_data: async function () {
          const rows = await CN_api.get(this.path, {
            select: { column: [
              "datetime",
              "note",
              { table: "trace_type", column: "name" },
              { table: "user", column: "first_name" },
              { table: "user", column: "last_name" },
            ]},
          });
          return rows.map(row => ({
            category: this,
            datetime: row.datetime,
            title:
              (null == row.name ? "removed trace" : `added to "${row.name}"`) +
              ` by ${row.first_name} ${row.last_name}`,
            description: row.note,
          }));
        },
      }]);

      if (CN_session.get_module("assignment")) {
        this.#category_list.push({
          subject: "assignment",
          path: `${base_path}/assignment`,
          get_data: async function () {
            const rows = await CN_api.get(this.path, {
              select: { column: [
                "start_datetime",
                "end_datetime",
                { table: "user", column: "first_name", alias: "user_first" },
                { table: "user", column: "last_name", alias: "user_last" },
                { table: "site", column: "name", alias: "site" },
                { table: "script", column: "name", alias: "script" },
              ]},
            });
            return rows.reduce((list, row) => {
              list.push({
                category: this,
                datetime: row.start_datetime,
                title: `started by ${row.user_first} ${row.user_last}`,
                description:
                  `Started an assignment for the "${row.script}" questionnaire.\n` +
                  `Assigned from the ${row.site} site.`,
              });
              list.push({
                category: this,
                datetime: row.end_datetime,
                title: `completed by ${row.user_first} ${row.user_last}`,
                description:
                  `Completed an assignment for the "${row.script}" questionnaire.\n` +
                  `Assigned from the ${row.site} site.`,
              });
              return list;
            }, []);
          },
        });
      }

      if (CN_session.get_module("equipment")) {
        this.#category_list.push({
          subject: "equipment",
          path: `${base_path}/equipment_loan`,
          get_data: async function () {
            const rows = await CN_api.get(this.path, {
              select: { column: [
                "start_datetime",
                "end_datetime",
                "note",
                { table: "equipment", column: "serial_number" },
                { table: "equipment_type", column: "name" },
              ]},
            });
            return rows.reduce((list, row) => {
              list.push({
                category: this,
                datetime: row.start_datetime,
                title: `loaned ${row.name}`,
                description:
                  `Loaned ${row.name} with serial number "${row.serial_number}"` +
                  (row.end_datetime ? "" : " (not yet returned)") +
                  (row.note ? `\nNote: ${row.note}` : ""),
              });
              list.push({
                category: this,
                datetime: row.end_datetime,
                title: `returned ${row.name}`,
                description:
                  `Returned ${row.name} with serial number "${row.serial_number}"` +
                  (row.note ? `\nNote: ${row.note}` : ""),
              });
              return list;
            }, []);
          },
        });
      }
    }

    this.#category_list.sort((a,b) => a.subject > b.subject);
  }

  /**
   * Extend Parent method
   */
  async get_text(type) {
    if ("crumb" == type) {
      const select = {
        select: {
          column: "participant" == this.get_model().get_name() ? "uid" : ["first_name", "last_name"]
        }
      };

      const data = await CN_api.get(this.get_model().get_view_url(null, "api"), select);
      return "participant" == this.get_model().get_name() ? data.uid : `${data.first_name} ${data.last_name}`;
    }

    if ("header" == type) {
      const columns = ["first_name", "last_name"];
      if ("participant" == this.get_model().get_name()) columns.push("uid");
      const data = await CN_api.get(this.get_model().get_view_url(null, "api"), { select: { column: columns } });
      return (
        CN_common.uc_words(this.get_model().get_singular()) +
        ` History for ${data.first_name} ${data.last_name}` +
        ("participant" == this.get_model().get_name() ? ` (${data.uid})` : "")
      );
    }
    return await super.get_text(type);
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
    await super.on_load();

    // load all category data, running all async get_data() functions in parallel
    this.#data_list = (await Promise.all( this.#category_list.map(category => category.get_data())))
      .reduce((list, a) => { list = list.concat(a); return list; }, [])
      .sort((a,b) => new Date(a.datetime) < new Date(b.datetime));
  }

  /**
   * Extend parent method
   */
  update_element() {
    super.update_element();

    const data_list_el = this.get_element().querySelector("[name=data_list]");
    data_list_el.innerHTML = "";
    this.#data_list.filter(data => null === this.get_query_parameter(data.category.subject)).forEach(data => {
      data_list_el.append(this.constructor.html(`
        <div class="card">
          <div class="card-body row p-2">
            <div class="col-4">
              <span class="fw-bold">
                ${CN_common.uc_words(data.category.subject.replace("_", " "))}:
              </span> ${data.title}<br/>
              ${CN_common.format_datetime(data.datetime, "datetimesecond")}
            </div>
            <div class="col-8">
              <span style="white-space: pre-wrap;">${null == data.description ? "" : data.description}</span>
            </div>
          <div>
        <div>
      `));
    });
  }

  /**
   * Extend parent method
   */
  create_placeholder_element() {
    const card_list = CN_common.get_list_of_numbers(10).map(() => `
      <div class="card">
        <div class="card-body row p-2">
          <div class="col-4 placeholder-glow">
            <span class="placeholder placeholder-lg col-${Math.ceil(Math.random()*3)+4}"></span><br/>
            <span class="placeholder placeholder-lg col-${Math.ceil(Math.random()*3)+2}"></span>
          </div>
          <div class="col-8 placeholder-glow">
            <span class="placeholder placeholder-lg col-12"></span>
            <span class="placeholder placeholder-lg col-${Math.ceil(Math.random()*6)+6}"></span>
          </div>
        </div>
      </div>
    `);

    return this.constructor.html(`<div name="data_list" class="container-fluid">${card_list.join("")}</div>`);
  }

  /**
   * Extend parent method
   */
  create_body_element() {
    const body_el = this.constructor.html(`
      <div>
        <div name="button_list" class="container-fluid"></div>
        <hr></hr>
        <div name="data_list" class="container-fluid"></div>
      </div>
    `);

    // add the visibility toggles
    const button_list_el = body_el.querySelector("[name=button_list]");

    button_list_el.append(this.constructor.html(`
      <div class="row">
        <button name="select_all" class="col btn btn-primary">Select All</button>
        <button name="select_none" class="col btn btn-primary">Select None</button>
      </div>
    `));

    button_list_el.querySelector("[name=select_all]").addEventListener("click", () => {
      this.#category_list.forEach(category => {
        this.set_query_parameter(category.subject, null);
      });
      this.get_element().querySelectorAll("[name=select_group] i").forEach(i_el => {
        i_el.classList.remove("bi-x-circle");
        i_el.classList.add("bi-check-circle");
      });
      this.update_element();
    });

    button_list_el.querySelector("[name=select_none]").addEventListener("click", () => {
      this.#category_list.forEach(category => {
        this.set_query_parameter(category.subject, "0");
      });
      this.get_element().querySelectorAll("[name=select_group] i").forEach(i_el => {
        i_el.classList.remove("bi-check-circle");
        i_el.classList.add("bi-x-circle");
      });
      this.update_element();
    });

    const select_group_el = this.constructor.html('<div name="select_group" class="row"></div>');
    button_list_el.append(select_group_el);

    this.#category_list.forEach(category => {
      const btn_el = this.constructor.html(`
        <button name="${category.subject}" class="col btn btn-light btn-outline-primary">
          ${CN_common.uc_words(category.subject)}
          <i class="bi bi-${null === this.get_query_parameter(category.subject) ? "check" : "x"}-circle"></i>
        </button>
      `);
      btn_el.addEventListener("click", () => {
        const i_el = btn_el.querySelector("i");
        if (null === this.get_query_parameter(category.subject)) {
          this.set_query_parameter(category.subject, "0");
          i_el.classList.replace("bi-check-circle", "bi-x-circle");
        } else {
          this.set_query_parameter(category.subject, null);
          i_el.classList.replace("bi-x-circle", "bi-check-circle");
        }
        this.update_element();
      });
      select_group_el.append(btn_el);
    });

    return body_el;
  }

  /**
   * Convenience method used by the create_footer_element() and create_topfooter_element() methods
   * @param element el
   */
  create_all_footer_elements(el) {
    // wire up the buttons
    const back_btn_el = el.querySelector("button[name=back]");
    back_btn_el.addEventListener("click", this.on_navigate_to_parent.bind(this));

    const notes_btn_el = el.querySelector("button[name=notes]");
    notes_btn_el.addEventListener(
      "click",
      CN_session.navigate_to.bind(CN_session, this.get_model().get_notes_url()),
    );
  }

  /**
   * Extend parent method
   */
  create_footer_element() {
    const footer_el = this.constructor.html(`
      <div class="d-flex w-100">
        <div class="me-auto btn-group" role="group" name="left-btn-group">
          <button name="notes" type="button" class="btn btn-light btn-outline-primary">Notes</button>
        </div>
        <div class="btn-group" role="group" name="right-btn-group">
          <button name="back" type="button" class="btn btn-primary">
            View ${CN_common.uc_words(this.get_model().get_singular())}
          </button>
        </div>
      </div>
    `);

    this.create_all_footer_elements(footer_el);

    return footer_el;
  }

  /**
   * Extend parent method
   */
  create_topfooter_element() {
    // no need to create the top-footer as it gets cloned from the footer
    const topfooter_el = super.create_topfooter_element();
    this.create_all_footer_elements(topfooter_el);
    return topfooter_el;
  }
}
