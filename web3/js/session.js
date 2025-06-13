// SESSION

import CN_api from "./api.js"
import CN_common from "./common.js"
import CN_element from "./element.js"

import { CN_base_add } from "./base_add.js"
import { CN_base_list } from "./base_list.js"
import { CN_base_view } from "./base_view.js"

import { CN_home_model } from "./model/home.js"
import { CN_error_model } from "./model/error.js"

export default {
  data: null,
  system_message_list: [],

  home_model: null,
  error_model: null,

  logout: async function() {
    try {
      await CN_api.delete("self/0");
      window.location.assign(ROOT_URL);
    } catch (error) {
      console.error(error);
    }
  },

  update_data: async function() {
    const response = await CN_api.get("self/0");
    this.data = await response.json();

    // convert use_12hour_clock to am_pm
    this.data.user.am_pm = this.data.user.use_12hour_clock;
    delete this.data.user.use_12hour_clock;
    for(const module_name in this.data.modules) {
      this.data.modules[module_name].children.sort();
      this.data.modules[module_name].choosing.sort();
      this.data.modules[module_name].action_allowed = function(type) {
        return this.actions.hasOwnProperty(type);
      };
    }

    if (this.data.application.development_mode) console.info("Development mode");
  },

  update_system_messages: async function() {
    const response = await CN_api.get(
      "self/0/system_message",
      {
        no_activity: 1,
        select: { column: ["id", "title", "note", "unread"] },
        modifier: { order: { unread: true, id: false } },
      },
    );
    this.system_message_list = await response.json();
  },

  update_breadcrumbs: function() {
    // add the breadcrumbs
    const breadcrumbs_el = document.querySelector("#main-menu-header div[name=breadcrumbs]");
    breadcrumbs_el.innerHTML = "";
    (async () => { breadcrumbs_el.append(await CN_element.create_breadcrumb_trail(this.data.operation_list)); })();
  },

  get_time: function() {
    let now = moment();
    now.tz(this.data.user.timezone);
    return now.format(CN_common.get_time_format(this.data.user.am_pm, false, true));
  },

  load_modules: async function() {
    const href_parts = window.location.pathname
      .replace(new RegExp(`${ROOT_URL}/`), "")
      .split("/")
      .filter(str => 0 < str.length);

    // first clear out all module operations
    for(const module_name in this.data.modules) {
      if (this.data.modules[module_name].hasOwnProperty("operation")) {
        delete this.data.modules[module_name].operation;
      }
    }

    // now set all new operations and import any missing models
    this.data.operation_list = [];
    let parent_subject = null;
    let subject = null;
    let action = null;
    let module = null;
    let load_module_list = [];

    // parse the href and collect a list of all modules that need to be loaded
    href_parts.forEach((str, index) => {
      const m = index % 3;
      const i = Math.floor(index / 3);
      if (0 == m) {
        // identify and validate the module's subject
        parent_subject = subject;
        subject = str;
        if (!this.data.modules[subject]) {
          throw new Error(`Error loading modules: module "${subject}" does not exist`);
        }
        module = null == subject ? null : this.data.modules[subject];

        this.data.operation_list.push(subject);

        // if this is the root module then make sure it's allowed to be the root
        if (null == parent_subject) {
          let root_allowed = false;
          for (const m in this.data.menu.lists) {
            if (this.data.menu.lists[m] === subject) {
              root_allowed = true;
              break;
            }
          }

          if (!root_allowed) {
            let error = new URIError();
            error.error_code = null;
            error.name = "Not Found";
            error.message = "The needed resource could not be found."
            throw error;
          }

          // create the operation object
          module.operation = { parent_module: null, action: null };
        } else {
          // create the operation object
          module.operation = {
            parent_module: this.data.modules[parent_subject],
            action: null,
          };
        }

        // define this module in the parent
        if (null != parent_subject) {
          // make sure the parent can have this module as a child
          if (!module.operation.parent_module.children.includes(subject)) {
            throw new Error(
              `Error loading modules: module "${subject}" is not child of "${parent_subject}"`
            );
          }

          // make sure the parent can have this module as a choosing
          if (!module.operation.parent_module.choosing.includes(subject)) {
            throw new Error(
              `Error loading modules: module "${subject}" is not choosing of "${parent_subject}"`
            );
          }
        }

        // now import the model if it hasn't been loaded yet
        if (!load_module_list.includes(subject)) load_module_list.push(subject);
      } else if (1 == m) {
        // validate and set the module's current action
        action = str;
        if (!module.action_allowed(action)) {
          throw new Error(
            `Error loading modules: module "${subject}" does not allow action "${action}"`
          );
        }
        module.operation.action = action;

        // if viewing then import all missing child module classes
        if ("view" == action) {
          module.children.concat(module.choosing).forEach((child_subject) => {
            if (!this.data.modules[child_subject]) {
              throw new Error(`Error loading modules: module "${child_subject}" does not exist`);
            }
            const child_module = this.data.modules[child_subject];

            child_module.operation = {
              parent_module: module,
              action: "list",
            };

            if (!load_module_list.includes(child_subject)) load_module_list.push(child_subject);
          });
        }
      } else if (2 == m) {
        module.operation.identifier = str;
      }
    });

    // now import all modules
    await Promise.all(
      load_module_list.map(async module_name => {
        const module = this.data.modules[module_name];
        // import the model if it hasn't been loaded yet
        if (CN_common.is_object(module.classes)) return;

        const classes = await import(`./model/${module_name}.js`);
        const prefix = `CN_${module_name}`;
        module.classes = {
          model: classes[`${prefix}_model`],
          add: classes[`${prefix}_add`] ? classes[`${prefix}_add`] : CN_base_add,
          list: classes[`${prefix}_list`] ? classes[`${prefix}_list`] : CN_base_list,
          view: classes[`${prefix}_view`] ? classes[`${prefix}_view`] : CN_base_view,
        };
      })
    );
  },

  render: async function() {
    const main_content_el = document.getElementById("main-content");
    main_content_el.innerHTML = "";

    // create all models and validate all operations
    for (const module_name in this.data.modules) {
      const module = this.data.modules[module_name];
      if (CN_common.is_object(module.operation)) {
        const op = module.operation;
        if (null == op.action) {
          throw new Error(`Error loading modules: module "${module_name} has no operation"`);
        } else if (op.hasOwnProperty("identifier") && ["add", "list"].includes(op.action)) {
          throw new Error(
            `Error loading modules: module "${module_name}" has identifier for ${op.action} action`
          );
        } else if (!op.hasOwnProperty("identifier") && "view" == op.action) {
          throw new Error(
            `Error loading modules: module "${module_name}" has no identifier for "${op.action}" action`
          );
        }

        module.model = new module.classes.model(module);
      }
    }

    // render the last module's content
    let model = null;
    if (0 == this.data.operation_list.length) {
      // render the home module as the main content
      model = new CN_home_model();
    } else {
      // render the last module as the main content
      const last_module_name = this.data.operation_list[this.data.operation_list.length-1];
      model = this.data.modules[last_module_name].model;
    }

    // TODO: is this try/catch block necessary? if so then explain why
    try {
      const module_el = model.render();
      main_content_el.append(module_el);

      // first load all parent views as their data may be needed by the leaf model
      await Promise.all(
        this.data.operation_list
          .filter(module_name => module_name != model.module.subject)
          .map(module_name => this.data.modules[module_name].model.actions.view.on_load())
      );

      // now run the model and update the breadcrumbs
      await model.run();
      await this.update_breadcrumbs();
    } catch (error) {
      throw error;
    }
  },

  render_error: function(error) {
    const main_content_el = document.getElementById("main-content");
    main_content_el.innerHTML = "";

    // render the error as the main content
    const model = new CN_error_model(error);
    if (error instanceof URIError) model.status = 404;
    const error_module_el = model.render();
    main_content_el.append(error_module_el);
  },

  navigate_to: async function(path) {
    if (this.data.application.development_mode) console.info(`navigating to /${path}`);
    window.history.pushState({}, "", `${ROOT_URL}/${path}`);

    try {
      await this.load_modules();
      await this.render();
    } catch (error) {
      this.render_error(error);
    }
  },

  create_body: function() {
    const body_el = document.querySelector("body");
    const split_lists = 20 <= Object.keys(this.data.menu.lists).length;

    body_el.innerHTML = `
      <nav id="main-menu-header" class="navbar navbar-expand-lg navbar-dark bg-primary p-0">
        <div class="container-fluid">
          <button
            name="menu-button"
            type="button"
            class="btn btn-outline-light my-1"
            data-bs-toggle="offcanvas"
            data-bs-target="#main-menu-offcanvas"
          >
            <strong>${APP_TITLE}</strong>
          </button>
          <div name="breadcrumbs" class="collapse navbar-collapse ms-2">
          </div>
          <div class="d-flex">
            <span name="access" class="nav-item text-light"></span>
            <div name="clock" class="nav-item text-light px-3">
              <i class="bi-clock-fill"></i>
              <span name="time" class="nav-item"></span>
            </div>
          </div>
        </div>
      </nav>

      <div
        class="offcanvas offcanvas-top h-auto"
        id="main-menu-offcanvas"
        aria-labelledby="main-menu-offcanvas-label"
        data-bs-backdrop="false"
        tabindex="-1"
        style="translate: 0 46px;"
      >
        <div class="offcanvas-body bg-light">
          <div class="row g-2">
            <div class="col">
              <button name="account" type="button" class="btn btn-secondary w-100">Account</button>
            </div>
            <div class="col">
              <button name="timezone" type="button" class="btn btn-secondary w-100">Timezone</button>
            </div>
            <div class="col">
              <button name="password" type="button" class="btn btn-secondary w-100">Password</button>
            </div>
            <div class="col">
              <button name="logout" type="button" class="btn btn-secondary w-100">Logout</button>
            </div>
          </div>
          <div class="row mt-1 g-2">
            <div class="col-${split_lists ? 6 : 4}">
              <div name="lists" class="btn-group-vertical w-100">
                <button type="button" class="btn btn-primary" disabled>Lists</button>
              </div>
            </div>
            <div class="col-${split_lists ? 3 : 4}">
              <div name="utilities" class="btn-group-vertical w-100">
                <button type="button" class="btn btn-primary" disabled>Utilities</button>
              </div>
            </div>
            <div class="col-${split_lists ? 3 : 4}">
              <div name="reports" class="btn-group-vertical w-100">
                <button type="button" class="btn btn-primary" disabled>Reports</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        id="main-toast-container"
        aria-live="polite"
        aria-atomic="true"
        class="d-flex justify-content-center align-items-center w-100"
      >
        <div class="toast-container top-0 start-50 translate-middle-x p-3">
        </div>
      </div>
      <div id="main-content" class="container-fluid my-2" />
    `;
  },

  start: async function() {
    await this.update_data();
    this.create_body();

    const main_menu_header_el = document.getElementById("main-menu-header");
    const main_menu_offcanvas_el = document.getElementById("main-menu-offcanvas");
    const main_menu_offcanvas_bs = new bootstrap.Offcanvas(main_menu_offcanvas_el);
    const access_el = main_menu_header_el.querySelector("span[name=access]");
    const clock_el = main_menu_header_el.querySelector("div[name=clock]");
    const time_el = main_menu_header_el.querySelector("span[name=time]");
    const account_btn_el = main_menu_offcanvas_el.querySelector("button[name=account]");
    const timezone_btn_el = main_menu_offcanvas_el.querySelector("button[name=timezone]");
    const password_btn_el = main_menu_offcanvas_el.querySelector("button[name=password]");
    const logout_btn_el = main_menu_offcanvas_el.querySelector("button[name=logout]");
    const lists_el = main_menu_offcanvas_el.querySelector("div[name=lists]");
    const utilities_el = main_menu_offcanvas_el.querySelector("div[name=utilities]");
    const reports_el = main_menu_offcanvas_el.querySelector("div[name=reports]");

    access_el.innerHTML = `${this.data.role.name} @ ${this.data.site.name}`;

    // keep the clock running
    const update_clock = () => time_el.innerHTML = this.get_time();
    update_clock();
    setInterval(update_clock, 1000);

    // wire up the clock and menu buttons
    clock_el.onclick = () => {
      const bs = CN_element.create_clock_settings_modal();
      bs.show();
    }
    account_btn_el.onclick = () => {
      const bs = CN_element.create_account_modal();
      bs.show();
    }
    timezone_btn_el.onclick = () => {
      const bs = CN_element.create_clock_settings_modal();
      bs.show();
    }
    password_btn_el.onclick = () => {
      const bs = CN_element.create_password_modal();
      bs.show();
    }
    logout_btn_el.onclick = async () => await this.logout();

    const lists_total = Object.keys(this.data.menu.lists).length;

    if (20 <= lists_total) {
      lists_el.append(CN_element.create(`
        <div class="row w-100 g-0">
          <div name="first-col" class="col btn-group-vertical pe-0"></div>
          <div name="second-col" class="col btn-group-vertical ps-0"></div>
        </div>
      `));
    }

    let index = 0;
    for (const title in this.data.menu.lists) {
      const name = this.data.menu.lists[title];

      const btn_el = CN_element.create(`
        <button type="button" class="btn btn-outline-primary w-100">${title}</button>
      `);
      btn_el.onclick = async () => {
        main_menu_offcanvas_bs.hide();
        await this.navigate_to(`${name}/list`);
      };

      if (20 <= lists_total) {
        if (2*index < lists_total) {
          lists_el.querySelector("[name=first-col]").append(btn_el);
        } else {
          lists_el.querySelector("[name=second-col]").append(btn_el);
        }
      } else {
        lists_el.append(btn_el);
      }

      index++;
    }

    for (const title in this.data.menu.utilities) {
      utilities_el.append(CN_element.create(`
        <button type="button" class="btn btn-outline-primary">${title}</button>
      `));
    }

    for (const title in this.data.menu.reports) {
      reports_el.append(CN_element.create(`
        <button type="button" class="btn btn-outline-primary">${title}</button>
      `));
    }

    try {
      await this.load_modules();
      await this.render();

      // check for system messages every 5 minutes
      setInterval(async () => {
        await this.update_system_messages();
        await this.update_breadcrumbs();
      }, 300000);
    } catch (error) {
      this.render_error(error);
    }
  },
}
