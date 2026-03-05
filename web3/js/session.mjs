import { CN_api } from "./api.mjs"
import { CN_base_element } from "./element/base_element.mjs"
import { CN_base_object } from "./base_object.mjs"
import { CN_common } from "./common.mjs"
import { CN_error_model } from "./model/error.mjs"
import { CN_home_model } from "./model/home.mjs"
import { CN_modal_account } from "./element/modal/account.mjs"
import { CN_modal_clock_settings } from "./element/modal/clock_settings.mjs"
import { CN_modal_message } from "./element/modal/message.mjs"
import { CN_modal_password } from "./element/modal/password.mjs"
import { CN_modal_site_role } from "./element/modal/site_role.mjs"
import { CN_module } from "./module.mjs"

/**
 * A private list of all modules used by the session
 */
const MODULE_MAP = new Map();

/**
 * A private array of models based on the current path
 */
let PATH_MODEL_LIST = [];

/**
 * The session class which handles the application
 */
export class CN_session extends CN_base_object {
  static data = null;
  static system_message_list = [];

  static home_model = null;
  static error_model = null;

  constructor() {
    throw new Error("Abstract class CN_session can't be instantiated.");
  }

  /**
   * Gets a module by name
   * @param string name: The module's name
   */
  static get_module(name) { return MODULE_MAP.get(name); }

  /**
   * Returns the last model in the path (model currently showing on screen)
   * @return model
   */
  static get_leaf_model() {
    return 0 == PATH_MODEL_LIST.length ? null : PATH_MODEL_LIST[PATH_MODEL_LIST.length-1];
  }

  /**
   * Returns the first model in the path
   * @return model
   */
  static get_root_model() {
    return 0 == PATH_MODEL_LIST.length ? null : PATH_MODEL_LIST[0];
  }

  /**
   * Returns the name.action of the root module (or null if there is no root module)
   * @return string
   */
  static get_root_action_name() {
    const model = 0 == PATH_MODEL_LIST.length ? null : PATH_MODEL_LIST[0];
    return model ? `${model.get_name()}.${model.get_action_name()}` : null;
  }

  /**
   * Returns the name.action of the leaf module (or null if there is no leaf module)
   * @return string
   */
  static get_leaf_action_name() {
    const model = this.get_leaf_model();
    return model ? `${model.get_name()}.${model.get_action_name()}` : null;
  }

  static set_loading_state(loading) {
    if (loading) {
      document.querySelector("div[name=app_bg]").classList.add("loading");
      document.querySelector("nav.navbar").classList.add("bg-loading");
    } else {
      document.querySelector("div[name=app_bg]").classList.remove("loading");
      document.querySelector("nav.navbar").classList.remove("bg-loading");
    }
  }

  /**
   * Reloads the page at a particular path
   * @param boolean root: Wether to return to the application root
   */
  static reload(root = false) {
    this.update_breadcrumbs(true);
    const menu_btn_group = document.querySelector("div[name=menu-btn-group]");
    menu_btn_group.innerHTML = "";
    menu_btn_group.append(CN_base_element.html(`
      <div class="spinner-border text-light" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    `));
    this.set_loading_state(true);
    document.getElementById("main-content").innerHTML = "";
    if (root) {
      window.location.assign(ROOT_URL);
    } else {
      window.location.reload();
    }
  }

  /**
   * Logs the user out of the application
   */
  static async logout() {
    await CN_base_element.wait_for(async () => {
      await CN_api.delete("self/0");
      this.reload(true);
    });
  }

  /**
   * Reads the user's session data from the server
   */
  static async update_data() {
    this.data = await CN_api.get("self/0");

    // convert use_12hour_clock to am_pm
    this.data.user.am_pm = this.data.user.use_12hour_clock;
    delete this.data.user.use_12hour_clock;

    // prepare notations
    const notations = this.data.notation.reduce((list, notation) => {
      if (!list.hasOwnProperty(notation.subject)) list[notation.subject] = {};
      list[notation.subject][notation.type] = notation.description;
      return list;
    }, {});

    // create all modules
    MODULE_MAP.clear();
    const modules = this.data.modules;
    delete this.data.modules;
    for(const module_name in modules) {
      const params = modules[module_name];

      // a module is "root" if it's found in the list, utility menus, is a custom_report or report_type
      params.root = ["custom_report", "report_type"].includes(module_name);

      if (!params.root && null != this.data.menu.lists) {
        for (const m in this.data.menu.lists) {
          if (this.data.menu.lists[m] === module_name) {
            params.root = true;
            break;
          }
        }
      }

      if (!params.root && null != this.data.menu.utilities) {
        for (const u in this.data.menu.utilities) {
          if (this.data.menu.utilities[u].subject === module_name) {
            params.root = true;
            break;
          }
        }
      }

      // add the module's notations
      params.notations = notations.hasOwnProperty(module_name) ? notations[module_name] : {};

      MODULE_MAP.set(module_name, new CN_module(params));
    }

    MODULE_MAP.forEach(module => module.resolve_children());
  }

  /**
   * Updates the system message list
   */
  static async update_system_messages() {
    this.system_message_list = await CN_api.get(
      "self/0/system_message",
      {
        no_activity: 1,
        select: { column: ["id", "title", "note", "unread"] },
        modifier: { order: { unread: true, id: false } },
      },
    );
  }

  /**
   * Updates the breadcrumb trail based on the current URL
   */
  static update_breadcrumbs(loading = false) {
    // add the breadcrumbs
    const breadcrumbs_el = document.querySelector("#main-menu-header div[name=breadcrumbs]");
    breadcrumbs_el.innerHTML = "";
    (async () => {
      if (!loading) await this.update_system_messages();
      breadcrumbs_el.append(
        await CN_base_element.create_breadcrumb_trail(
          loading ? "Loading..." : null,
          loading ? [] : PATH_MODEL_LIST,
        )
      );
    })();
  }

  /**
   * Gets the current time formatted by the user's preferences
   * @return string
   */
  static get_time() {
    const datetime = CN_common.format_time(new Date());
    const tz = Intl.DateTimeFormat(
      'en-CA',
      { timeZone: this.data.user.timezone, timeZoneName: "short" }
    ).formatToParts(new Date()).find(o => o.type == "timeZoneName").value;
    return `${datetime} ${tz}`;
  }

  static get_timezone() {
    return this.data.user.timezone;
  }

  static get_am_pm() {
    return this.data.user.am_pm;
  }

  static get_tz_offset() {
    return this.data.user.tz_offset;
  }

  static async set_timezone(timezone, am_pm) {
    if (this.data.user.timezone != timezone || this.data.user.am_pm != am_pm) {
      this.update_breadcrumbs(true);
      const menu_btn_group = document.querySelector("div[name=menu-btn-group]");
      menu_btn_group.innerHTML = "";
      menu_btn_group.append(CN_base_element.html(`
        <div class="spinner-border text-light" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      `));
      this.set_loading_state(true);
      document.getElementById("main-content").innerHTML = "";

      // update the user then reload the UI so all datetimes are adjusted
      try {
        await CN_api.patch("self/0", { user: { timezone: timezone, use_12hour_clock: am_pm }});
      } catch (error) {
        if (409 == error.response.status) {
          // a 409 error means the address, participant or alternate was not found
          let type = null;
          if (CN_common.is_object(timezone)) {
            const keys = Object.keys(timezone);
            if (0 < keys.length) type = keys[0].replace(/_id$/, "");
          }

          const params = { type: "danger" };
          if (null == type) {
            params.title = "";
            params.message = "";
          } else {
            params.title = "No Timezone Available";
            params.message = (
              "address" == type ?
              "The selected address was not found.  The page will now reload so you may try again." :
              `The ${type} does not have an active address so there is no way determine their timezone.`
            );
          }

          await (new CN_modal_message(params)).open();
        } else {
          throw error;
        }
      } finally {
        window.location.reload(); // do not use the session's reload function
      }
    }
  }

  /**
   * Loads all modules and creates all models based on the current URL
   */
  static async load() {
    const main_content_el = document.getElementById("main-content");
    const menu_el = document.getElementById("main-menu-offcanvas").querySelector("div[name=menu]");

    // un-highlight any selected menu button
    const selected_menu_btn_el = menu_el.querySelector("button.fw-bold");
    if (selected_menu_btn_el) selected_menu_btn_el.classList.remove("fw-bold");

    // reset the path model list
    PATH_MODEL_LIST.length = 0;

    // build the action list based on the path
    const href_parts = window.location.pathname
      .replace(new RegExp(`${ROOT_URL}/`), "")
      .split("/")
      .filter(str => 0 < str.length);
    let model_data_list = [];
    let model_data = null;
    let module = null;

    // parse the href and re-create the path model list, collecting all promises along the way
    const promise_list = [];
    href_parts.forEach((str, index) => {
      const m = index % 3;
      const i = Math.floor(index / 3);
      if (0 == m) {
        const module_name = str;

        // validate the module
        module = this.get_module(module_name);
        if (!module) {
          // this is usually because the user does not have access to the module
          let error = new URIError();
          error.error_code = null;
          error.name = "Invalid URL";
          error.message = `Error loading session: module "${module_name}" does not exist`;
          throw error;
        }

        if (CN_common.is_object(model_data)) {
          // gather the promise from loading the module's classes
          promise_list.push(model_data.module.load_classes());
          model_data_list.push(model_data);
        } else if (!module.is_root()) {
          // make sure that only root modules can be the root action
          let error = new URIError();
          error.error_code = null;
          error.name = "Invalid URL";
          error.message = `Tried to load non-root module "${module.get_name()}" as root.`;
          throw error;
        }

        // create the next action
        model_data = { module: this.get_module(module_name) };
      } else if (1 == m) {
        model_data.action = str;
      } else if (2 == m) {
        model_data.identifier = str;
      }
    });

    if (CN_common.is_object(model_data)) {
      // add the child model to the list
      promise_list.push(model_data.module.load_classes());
      model_data_list.push(model_data);

      // if viewing the child model then load its children classes as well
      if ("view" == model_data.action) {
        promise_list.push(...model_data.module.get_child_modules().map(m => m.load_classes()));
      }
    }

    // now load all necessary classes
    await Promise.all(promise_list);

    // create and configure all models
    let parent_model = null;
    PATH_MODEL_LIST = model_data_list.map((model_data, index) => {
      const model = model_data.module.create_model();
      model.configure(
        main_content_el,
        model_data.action,
        model_data.identifier,
        parent_model,
        index == model_data_list.length-1
      );
      parent_model = model;
      return model;
    });

    // highlight menu item corresponding with the path's first model
    if (0 < PATH_MODEL_LIST.length) {
      let name = this.get_root_action_name();
      // reports all have the same action name, so add the report-type identifier
      if ("report_type.view" == this.get_root_action_name()) name += '.' + this.get_root_model().get_identifier();

      let menu_btn_el = menu_el.querySelector(`button[name="${name}"]`);
      if (menu_btn_el) {
        menu_btn_el.classList.add("fw-bold");
      } else {
        menu_btn_el = menu_el.querySelector(`button[name="${PATH_MODEL_LIST[0].get_name()}.list"]`);
        if (menu_btn_el) menu_btn_el.classList.add("fw-bold");
      }
    }
  }

  /**
   * Renders the current state to the UI based on the loaded modules/models
   */
  static async render() {
    const main_content_el = document.getElementById("main-content");
    main_content_el.innerHTML = "";

    // determine the leaf model
    let leaf_model = this.get_leaf_model();
    if (null == leaf_model) leaf_model = new CN_home_model();

    // first load all non-leaf models in parallel as their data may be needed by the leaf model
    await Promise.all(PATH_MODEL_LIST.slice(0, -1).map(model => model.get_action().on_load()));

    // now render and run the leaf module
    main_content_el.append(leaf_model.render());
    await leaf_model.run();
    await this.update_breadcrumbs();
  }

  /**
   * Renders an error to the UI
   */
  static render_error(error) {
    const main_content_el = document.getElementById("main-content");
    main_content_el.innerHTML = "";

    // render the error as the main content
    const model = new CN_error_model(error);
    if (error instanceof URIError) model.status = 404;
    const error_module_el = model.render();
    main_content_el.append(error_module_el);
  }

  /**
   * Navigates the browser to the given path
   */
  static async navigate_to(path) {
    if (this.data.application.development_mode) console.info(`navigating to /${path}`);
    window.history.pushState({}, "", `${ROOT_URL}/${path}`);

    try {
      await this.load();
      await this.render();
    } catch (error) {
      this.render_error(error);
    }
  }

  /**
   * Creates the main UI body
   */
  static create_body() {
    document.querySelector("div[name=app_body]").innerHTML = `
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
          <div name="menu-btn-group" class="d-flex">
            <button name="access" class="btn btn-outline-light mx-1"></button>
            <button name="clock" class="btn btn-outline-light">
              <i class="bi-clock-fill"></i>
              <span name="time" class="nav-item"></span>
            </button>
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
          <div name="menu" class="row mt-1 g-2"></div>
        </div>
      </div>
      <div id="main-content" class="container-fluid my-2"></div>
    `;
  }

  /**
   * Starts the application
   */
  static async start() {
    await this.update_data();
    if (this.data.application.development_mode) console.info("Development mode");
    this.create_body();

    const split_lists = null != this.data.menu.lists && 20 <= Object.keys(this.data.menu.lists).length;
    const main_menu_header_el = document.getElementById("main-menu-header");
    const main_menu_offcanvas_el = document.getElementById("main-menu-offcanvas");
    const main_menu_offcanvas_bs = new bootstrap.Offcanvas(main_menu_offcanvas_el);

    const access_el = main_menu_header_el.querySelector("button[name=access]");
    access_el.innerHTML = `${CN_common.uc_words(this.data.role.name)} @ ${this.data.site.name}`;
    access_el.addEventListener("click", () => {
      main_menu_offcanvas_bs.hide();
      (new CN_modal_site_role()).open();
    });

    // keep the clock running
    const time_el = main_menu_header_el.querySelector("span[name=time]");
    const update_clock = () => time_el.innerHTML = this.get_time();
    update_clock();
    setInterval(update_clock, 1000);

    // wire up the clock and menu buttons
    const clock_el = main_menu_header_el.querySelector("button[name=clock]");
    clock_el.addEventListener("click", () => {
      main_menu_offcanvas_bs.hide();
      (new CN_modal_clock_settings()).open();
    });
    const account_btn_el = main_menu_offcanvas_el.querySelector("button[name=account]");
    account_btn_el.addEventListener("click", () => {
      main_menu_offcanvas_bs.hide();
      (new CN_modal_account()).open();
    });
    const timezone_btn_el = main_menu_offcanvas_el.querySelector("button[name=timezone]");
    timezone_btn_el.addEventListener("click", () => {
      main_menu_offcanvas_bs.hide();
      (new CN_modal_clock_settings()).open();
    });
    const password_btn_el = main_menu_offcanvas_el.querySelector("button[name=password]");
    password_btn_el.addEventListener("click", () => {
      main_menu_offcanvas_bs.hide();
      (new CN_modal_password()).open();
    });
    const logout_btn_el = main_menu_offcanvas_el.querySelector("button[name=logout]");
    logout_btn_el.addEventListener("click", async () => {
      main_menu_offcanvas_bs.hide();
      await this.logout();
    });

    // determine the column width of each sub-menu
    const total_menus = (
      (null == this.data.menu.lists ? 0 : 1) +
      (null == this.data.menu.utilities ? 0 : 1) +
      (null == this.data.menu.reports ? 0 : 1)
    );
    const col_width = 1 < total_menus ?  12/(total_menus + (split_lists?1:0)) : null;

    // build the lists sub-menu
    if (null != this.data.menu.lists) {
      const sub_menu_el = CN_base_element.html(`
        <div name="lists">
          <div class="btn-group-vertical w-100">
            <button type="button" class="btn btn-primary" disabled>Lists</button>
          </div>
        </div>
      `);
      if (null != col_width) sub_menu_el.classList.add(`col-${split_lists ? 2*col_width : col_width}`);
      main_menu_offcanvas_el.querySelector("div[name=menu]").append(sub_menu_el);

      const btn_group_el = sub_menu_el.querySelector("div.btn-group-vertical");
      if (split_lists) {
        btn_group_el.append(CN_base_element.html(`
          <div class="row w-100 g-0">
            <div name="a" class="col btn-group-vertical pe-0"></div>
            <div name="b" class="col btn-group-vertical ps-0"></div>
          </div>
        `));
      }

      const lists_total = Object.keys(this.data.menu.lists).length;
      let index = 0;
      for (const title in this.data.menu.lists) {
        const name = this.data.menu.lists[title];
        const btn_el = CN_base_element.html(`
          <button name="${name}.list" type="button" class="btn btn-outline-primary">${title}</button>
        `);
        btn_el.addEventListener("click", async () => {
          main_menu_offcanvas_bs.hide();
          await this.navigate_to(`${name}/list`);
        });

        // split lists need to distribute menu items across two button groups
        const parent_el = (
          split_lists ?
          btn_group_el.querySelector(`[name=${2*index < lists_total ? "a" : "b"}]`) :
          btn_group_el
        );
        parent_el.append(btn_el);

        index++;
      }
    }

    // build the utilities sub-menu
    if (null != this.data.menu.utilities) {
      const sub_menu_el = CN_base_element.html(`
        <div name="utilities">
          <div class="btn-group-vertical w-100">
            <button type="button" class="btn btn-primary" disabled>Utilities</button>
          </div>
        </div>
      `);
      if (null != col_width) sub_menu_el.classList.add(`col-${col_width}`);
      main_menu_offcanvas_el.querySelector("div[name=menu]").append(sub_menu_el);

      const btn_group_el = sub_menu_el.querySelector("div.btn-group-vertical");
      for (const title in this.data.menu.utilities) {
        const utility = this.data.menu.utilities[title];
        const btn_el = CN_base_element.html(`
          <button
            name="${utility.subject}.${utility.action}"
            type="button"
            class="btn btn-outline-primary"
          >${title}</button>
        `);
        btn_el.addEventListener("click", async () => {
          main_menu_offcanvas_bs.hide();
          await this.navigate_to(`${utility.subject}/${utility.action}`);
        });
        btn_group_el.append(btn_el);
      }
    }

    // build the reports sub-menu
    if (null != this.data.menu.reports) {
      const sub_menu_el = CN_base_element.html(`
        <div name="reports">
          <div class="btn-group-vertical w-100">
            <button type="button" class="btn btn-primary" disabled>Reports</button>
          </div>
        </div>
      `);
      if (null != col_width) sub_menu_el.classList.add(`col-${col_width}`);
      main_menu_offcanvas_el.querySelector("div[name=menu]").append(sub_menu_el);

      const btn_group_el = sub_menu_el.querySelector("div.btn-group-vertical");
      for (const title in this.data.menu.reports) {
        const id = this.data.menu.reports[title];
        const btn_el = CN_base_element.html(`
          <button
            name="${null == id ? "custom_report.list" : "report_type.view." + id}"
            type="button"
            class="btn btn-outline-primary"
          >${title}</button>
        `);
        btn_el.addEventListener("click", async () => {
          main_menu_offcanvas_bs.hide();
          await this.navigate_to(null == id ? "custom_report/list" : `report_type/view/${id}`);
        });
        btn_group_el.append(btn_el);
      }
    }

    try {
      await this.load();
      await this.render();

      // update the breadcrumbs every 5 minutes (this will check for system messages)
      setInterval(async () => {
        await this.update_breadcrumbs();
      }, 300000);
    } catch (error) {
      this.render_error(error);
    } finally {
      this.set_loading_state(false);
    }
  }
}
