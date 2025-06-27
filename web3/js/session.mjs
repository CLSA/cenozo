// SESSION

import CN_api from "./api.mjs"
import CN_common from "./common.mjs"
import CN_element from "./element.mjs"

import { CN_base_add } from "./base_add.mjs"
import { CN_base_list } from "./base_list.mjs"
import { CN_base_view } from "./base_view.mjs"
import { CN_error_model } from "./model/error.mjs"
import { CN_home_model } from "./model/home.mjs"
import { CN_module } from "./module.mjs"

/**
 * A private list of all modules used by the session
 */
const MODULE_MAP = new Map();

/**
 * A private array of operations based on the URL
 */
const OP_LIST = [];

/**
 * The session class which handles the application
 */
export default {
  data: null,
  system_message_list: [],

  home_model: null,
  error_model: null,

  /**
   * Gets a module by name
   * @param string name: The module's name
   */
  get_module: name => MODULE_MAP.get(name),

  /**
   * ADD DOCS
   */
  get_leaf_module: function() {
    return 0 == OP_LIST.length ? null : this.get_module(OP_LIST[OP_LIST.length-1]);
  },

  /**
   * Logs the user out of the application
   */
  logout: async function() {
    try {
      await CN_api.delete("self/0");
      window.location.assign(ROOT_URL);
    } catch (error) {
      console.error(error);
    }
  },

  /**
   * Reads the user's session data from the server
   */
  update_data: async function() {
    const response = await CN_api.get("self/0");
    this.data = await response.json();

    // convert use_12hour_clock to am_pm
    this.data.user.am_pm = this.data.user.use_12hour_clock;
    delete this.data.user.use_12hour_clock;

    // create all modules
    const modules = this.data.modules;
    delete this.data.modules;
    for(const module_name in modules) {
      const params = modules[module_name];
      // a module is "root" if it's found in the lists menu
      params.root = false;
      for (const m in this.data.menu.lists) {
        if (this.data.menu.lists[m] === module_name) {
          params.root = true;
          break;
        }
      }
      MODULE_MAP.set(module_name, new CN_module(params));
    }
  },

  /**
   * Updates the system message list
   */
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

  /**
   * Updates the breadcrumb trail based on the current URL
   */
  update_breadcrumbs: function() {
    // add the breadcrumbs
    const breadcrumbs_el = document.querySelector("#main-menu-header div[name=breadcrumbs]");
    breadcrumbs_el.innerHTML = "";
    (async () => { breadcrumbs_el.append(await CN_element.create_breadcrumb_trail(OP_LIST)); })();
  },

  /**
   * Gets the current time formatted by the user's preferences
   * @return string
   */
  get_time: function() {
    return CN_common.format_time(
      new Date(),
      this.data.user.timezone,
      this.data.user.am_pm,
      false,
      true
    );
  },

  /**
   * Loads all modules and creates all models based on the current URL
   */
  load: async function() {
    const href_parts = window.location.pathname
      .replace(new RegExp(`${ROOT_URL}/`), "")
      .split("/")
      .filter(str => 0 < str.length);

    // reset all module operations
    for (const [module_name, module] of MODULE_MAP) module.reset_operation();

    // now set all new operations and import any missing models
    OP_LIST.length = 0;
    let parent_module_name = null;
    let module_name = null;
    let action = null;
    let module = null;

    // parse the href and collect a list of all modules that need to be loaded
    href_parts.forEach((str, index) => {
      const m = index % 3;
      const i = Math.floor(index / 3);
      if (0 == m) {
        parent_module_name = null == module ? null : module.get_name();

        // validate the module's parent
        module = this.get_module(str);
        if (!module) throw new Error(`Error loading session: module "${str}" does not exist`);

        if (!module.set_operation_parent(parent_module_name)) {
          let error = new URIError();
          error.error_code = null;
          error.name = "Not Found";
          error.message = "The needed resource could not be found."
          throw error;
        }

        OP_LIST.push(module.get_name());
      } else if (1 == m) {
        // validate the module's action
        const result = module.set_operation_action(str);
        if ("not allowed" == result) {
          throw new Error(`Error loading session: module ${module.get_name()} does not allow action "${str}".`);
        }
      } else if (2 == m) {
        module.set_operation_identifier(str);
      }
    });

    // now load all models
    const promise_list = [];
    for (const [module_name, module] of MODULE_MAP) promise_list.push(module.load_classes());
    await Promise.all(promise_list);
  },

  /**
   * Renders the current state to the UI based on the loaded modules/models
   */
  render: async function() {
    const main_content_el = document.getElementById("main-content");
    main_content_el.innerHTML = "";

    // create all models and validate all operations
    for (const [module_name, module] of MODULE_MAP) module.create_model();

    // render the left module's content (or the home model if there are no operations
    const leaf_module = this.get_leaf_module();
    const model = leaf_module ? leaf_module.get_model() : new CN_home_model();

    // TODO: is this try/catch block necessary? if so then explain why
    try {
      const module_el = model.render();
      main_content_el.append(module_el);

      // first load all parent views as their data may be needed by the leaf model
      await Promise.all(OP_LIST
        .filter(module_name => module_name != model.get_name())
        .map(module_name => this.get_module(module_name).model.actions.view.on_load())
      );

      // now run the model and update the breadcrumbs
      await model.run();
      await this.update_breadcrumbs();
    } catch (error) {
      throw error;
    }
  },

  /**
   * Renders an error to the UI
   */
  render_error: function(error) {
    const main_content_el = document.getElementById("main-content");
    main_content_el.innerHTML = "";

    // render the error as the main content
    const model = new CN_error_model(error);
    if (error instanceof URIError) model.status = 404;
    const error_module_el = model.render();
    main_content_el.append(error_module_el);
  },

  /**
   * Navigates the browser to the given path
   */
  navigate_to: async function(path) {
    if (this.data.application.development_mode) console.info(`navigating to /${path}`);
    window.history.pushState({}, "", `${ROOT_URL}/${path}`);

    try {
      await this.load();
      await this.render();
    } catch (error) {
      this.render_error(error);
    }
  },

  /**
   * Creates the main UI body
   */
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

  /**
   * Starts the application
   */
  start: async function() {
    await this.update_data();
    if (this.data.application.development_mode) console.info("Development mode");
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
      await this.load();
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
