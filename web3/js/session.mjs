import { CN_api } from "./api.mjs"
import { CN_base_element } from "./element/base_element.mjs"
import { CN_base_object } from "./base_object.mjs"
import { CN_common } from "./common.mjs"
import { CN_element_breadcrumb_trail } from "./element/breadcrumb_trail.mjs"
import { CN_model_error } from "./model/error.mjs"
import { CN_modal_account } from "./modal/account.mjs"
import { CN_modal_clock_settings } from "./modal/clock_settings.mjs"
import { CN_modal_message } from "./modal/message.mjs"
import { CN_modal_password } from "./modal/password.mjs"
import { CN_modal_site_role } from "./modal/site_role.mjs"
import { CN_module } from "./module.mjs"

/**
 * The session class which handles the application
 */
class session extends CN_base_object {
  #module_map = new Map();
  #path_model_list = [];
  #data = null;
  #breadcrumb_trail;

  #main_menu_header_el;
  #main_menu_offcanvas_el;
  #main_menu_offcanvas_bs;
  #main_content_el;
  #breadcrumbs_el;
  #menu_btn_group_el;
  #menu_el;

  /**
   * ADD DOCS
   */
  get(category, property) {
    if (!this.#data.hasOwnProperty(category)) {
      throw new Error(`Tried to get unknown session category "${category}"`);
    }
    if (!this.#data[category].hasOwnProperty(property)) {
      throw new Error(`Tried to get unknown session ${category} property "${property}"`);
    }
    return this.#data[category][property];
  }

  /**
   * Gets a module by name
   * @param string name: The module's name
   */
  get_module(name) { return this.#module_map.get(name); }

  /**
   * Returns the last model in the path (model currently showing on screen)
   * @return model
   */
  get_leaf_model() {
    return 0 == this.#path_model_list.length ? null : this.#path_model_list[this.#path_model_list.length-1];
  }

  /**
   * Returns the first model in the path
   * @return model
   */
  get_root_model() {
    return 0 == this.#path_model_list.length ? null : this.#path_model_list[0];
  }

  /**
   * ADD DOCS
   */
  has_data() { return null !== this.#data; }

  /**
   * Navigates the browser to the given path
   */
  async navigate_to(path, query_params = null) {
    if (this.#data.application.development_mode) console.info(`navigating to /${path}`);

    // only include query parameters if there are any
    const query = (
      CN_common.is_object(query_params) && 0 < Object.keys(query_params).length ?
      "?" + (new URLSearchParams(query_params)).toString() :
      ""
    );
    window.history.pushState({}, "", `${ROOT_URL}/${path}${query}`);
    await this.render();
  }

  /**
   * ADD DOCS
   */
  open_menu() {
    this.#main_menu_offcanvas_bs.show();
  }

  /**
   * ADD DOCS
   */
  close_menu() {
    this.#main_menu_offcanvas_bs.hide();
  }

  /**
   * Handles browser navigation buttons
   */
  async render() {
    const { CN_app_session } = await import(`${ROOT_URL}/js/app_session.mjs`);

    this.#main_content_el.innerHTML = "";
    try {
      // show loading indicator in breadcrumb trail
      this.#breadcrumb_trail.set_config("loading", true);
      this.#breadcrumb_trail.update_element();

      await this.#load();

      // determine the leaf model
      let leaf_model = this.get_leaf_model();
      if (null == leaf_model) {
        // check if the application has a home model and if not use the framework's model instead
        let { CN_model_home } = await import(`${ROOT_URL}/js/model/home.mjs`);
        if (!CN_model_home) {
          const response = await import('./model/home.mjs');
          CN_model_home = response.CN_model_home;
        }
        leaf_model = new CN_model_home();
      }

      // first run all non-leaf models in parallel as their data may be needed by the leaf model
      await Promise.all(
        this.#path_model_list.slice(0, -1).map(model => (async () => {
          await model.get_action().run();
        })())
      );

      // now add the model's element to the DOM and run the leaf module
      this.#main_content_el.append(leaf_model.get_element());
      await leaf_model.run();

      // create the crumbs for the breadcrumb trail
      const crumb_list = [];
      await Promise.all(this.#path_model_list.map(model => (async () => {
        let crumb = { name: "...", path: "view" == model.get_action_name() ? model.get_view_url() : null };
        crumb_list.push(crumb);

        // get the name after we've added the crumb to the list, otherwise it may be out of order
        crumb.name = await model.get_action().get_text("crumb");
      })()));

      // update the breadcrumbs
      this.#breadcrumb_trail.set_config("loading", false);
      this.#breadcrumb_trail.set_config("crumb_list", crumb_list);
      this.#breadcrumb_trail.update_element();
      await CN_app_session.render();
    } catch (error) {
      console.error(error);
      const model = new CN_model_error(error);
      await model.run();
      this.#main_content_el.replaceChildren(model.get_element());

      // update the breadcrumbs
      this.#breadcrumb_trail.set_config("loading", false);
      this.#breadcrumb_trail.set_config("crumb_list", [{ name: "Error", path: null }]);
      this.#breadcrumb_trail.update_element();
    }
  }

  /**
   * Reloads the page at a particular path
   * @param boolean path: Which path to load (true for the application root, empty for the current URL)
   */
  reload(path = false) {
    // show loading indicator in breadcrumb trail
    this.#breadcrumb_trail.set_config("loading", true);
    this.#breadcrumb_trail.update_element();

    this.#main_content_el.innerHTML = "";
    this.#menu_btn_group_el.replaceChildren(CN_base_element.html(`
      <div class="spinner-border text-light" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    `));
    this.#set_loading_state(true);
    if (path) {
      window.location.assign(CN_common.is_string(path) ? `${ROOT_URL}/${path}` : ROOT_URL);
    } else {
      window.location.reload();
    }
  }

  async set_timezone(timezone, am_pm) {
    // ignore the request if the clock settings haven't changed
    if (this.#data.user.timezone == timezone && this.#data.user.am_pm == am_pm) return;

    // show loading indicator in breadcrumb trail
    this.#breadcrumb_trail.set_config("loading", true);
    this.#breadcrumb_trail.update_element();

    this.#main_content_el.innerHTML = "";
    this.#menu_btn_group_el.replaceChildren(CN_base_element.html(`
      <div class="spinner-border text-light" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    `));
    this.#set_loading_state(true);

    // update the user then reload the UI so all datetimes are adjusted
    try {
      await CN_api.patch("self/0", { user: { timezone: timezone, use_12hour_clock: am_pm }});
    } catch (error) {
      let type = null;
      if (CN_common.is_object(timezone)) {
        const keys = Object.keys(timezone);
        if (0 < keys.length) type = keys[0].replace(/_id$/, "");
      }

      const params = { header_class: "text-bg-danger" };
      if (null == type) {
        params.title = "Unknown Error";
        params.message = "The server was not able to change your timezone.";
      } else {
        params.title = "No Timezone Available";
        params.message = (
          "address" == type ?
          "The selected address was not found.  The page will now reload so you may try again." :
          `The ${type} does not have an active address so there is no way determine their timezone.`
        );
      }

      await CN_modal_message.create_and_open(params);
    } finally {
      window.location.reload(); // do not use the session's reload function
    }
  }

  /**
   * Starts the application
   */
  async start() {
    const { CN_app_session } = await import(`${ROOT_URL}/js/app_session.mjs`);

    await this.#update_data();
    if (this.#data.application.development_mode) console.info("Development mode");
    await this.#generate_ui();
    await CN_app_session.start();
    await this.render();

    this.#set_loading_state(false);
  }

  /**
   * ADD DOCS
   */
  update_breadcrumbs() {
    this.#breadcrumb_trail.update_element();
  }

  /**
   * Returns the name.action of the root module (or null if there is no root module)
   * @return string
   */
  #get_root_action_name() {
    const model = 0 == this.#path_model_list.length ? null : this.#path_model_list[0];
    return model ? `${model.get_name()}.${model.get_action_name()}` : null;
  }

  #set_loading_state(loading) {
    if (loading) {
      document.querySelector("div[name=app-bg]").classList.add("loading");
      document.querySelector("nav.navbar").classList.add("bg-loading");
    } else {
      document.querySelector("div[name=app-bg]").classList.remove("loading");
      document.querySelector("nav.navbar").classList.remove("bg-loading");
    }
  }

  /**
   * Logs the user out of the application
   */
  async #logout() {
    await CN_base_element.wait_for(async () => {
      await CN_api.delete("self/0");
      this.reload(true);
    });
  }

  /**
   * Reads the user's session data from the server
   */
  async #update_data() {
    this.#data = await CN_api.get("self/0");

    // convert use_12hour_clock to am_pm
    this.#data.user.am_pm = this.#data.user.use_12hour_clock;
    delete this.#data.user.use_12hour_clock;

    // check for mandatory password reset
    if (this.#data.user.no_password) {
      if (await CN_modal_password.create_and_open({ force: true })) {
        await CN_modal_message.create_and_open({
          title: "Password Changed",
          message: "Your password has been successfully changed.",
        });
      }
    }

    // prepare notations
    const notations = this.#data.notation.reduce((list, notation) => {
      if (!list.hasOwnProperty(notation.subject)) list[notation.subject] = {};
      list[notation.subject][notation.type] = notation.description;
      return list;
    }, {});

    // create all modules
    this.#module_map.clear();
    const modules = this.#data.modules;
    delete this.#data.modules;
    for(const module_name in modules) {
      const params = modules[module_name];

      // a module is "root" if it's found in the list, utility menus, or is one of the special modules
      params.root = ["home", "error", "custom_report", "report_type"].includes(module_name);

      if (!params.root && null != this.#data.menu.lists) {
        for (const m in this.#data.menu.lists) {
          if (this.#data.menu.lists[m] === module_name) {
            params.root = true;
            break;
          }
        }
      }

      if (!params.root && null != this.#data.menu.utilities) {
        for (const u in this.#data.menu.utilities) {
          if (this.#data.menu.utilities[u].subject === module_name) {
            params.root = true;
            break;
          }
        }
      }

      // add the module's notations
      params.notations = notations.hasOwnProperty(module_name) ? notations[module_name] : {};

      this.#module_map.set(module_name, new CN_module(params));
    }

    this.#module_map.forEach(module => module.resolve_children());
  }

  /**
   * Loads all modules and creates all models based on the current URL
   */
  async #load() {
    // un-highlight any selected menu button
    const selected_menu_btn_el = this.#menu_el.querySelector("button.fw-bold");
    if (selected_menu_btn_el) selected_menu_btn_el.classList.remove("fw-bold");

    // reset the path model list
    this.#path_model_list.length = 0;

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

    // create all models based on the path
    this.#path_model_list = model_data_list.map(model_data => model_data.module.create_model());

    // now that they are all created we can configure them all
    let parent_model = null;
    this.#path_model_list.forEach((model, index) => {
      model.configure(
        this.#main_content_el,
        model_data_list[index].action,
        model_data_list[index].identifier,
        parent_model,
        index == model_data_list.length-1 // only the last model is rendered
      );
      parent_model = model;
    });

    // highlight menu item corresponding with the path's first model
    if (0 < this.#path_model_list.length) {
      let name = this.#get_root_action_name();
      // reports all have the same action name, so add the report-type identifier
      if ("report_type.view" == this.#get_root_action_name()) {
        name += '.' + this.get_root_model().get_identifier();
      }

      let menu_btn_el = this.#menu_el.querySelector(`button[name="${name}"]`);
      if (menu_btn_el) {
        menu_btn_el.classList.add("fw-bold");
      } else {
        menu_btn_el = this.#menu_el.querySelector(`button[name="${this.#path_model_list[0].get_name()}.list"]`);
        if (menu_btn_el) menu_btn_el.classList.add("fw-bold");
      }
    }
  }

  /**
   * Creates the main UI body
   */
  async #generate_ui() {
    this.#main_menu_header_el = CN_base_element.html(`
      <nav id="main-menu-header" class="navbar navbar-expand-lg navbar-dark bg-primary p-0">
        <div class="container-fluid">
          <button
            name="menu-button"
            type="button"
            class="btn btn-outline-light fw-bold my-1"
            data-bs-toggle="offcanvas"
            data-bs-target="#main-menu-offcanvas"
          >${APP_TITLE}</button>
        </div>
      </nav>
    `);

    this.#breadcrumbs_el = CN_base_element.html(
      '<div name="breadcrumbs" class="collapse navbar-collapse ms-2"></div>'
    );
    this.#main_menu_header_el.querySelector("div.container-fluid").append(this.#breadcrumbs_el);
    this.#breadcrumb_trail = CN_element_breadcrumb_trail.append(this.#breadcrumbs_el, { loading: true });

    this.#menu_btn_group_el = CN_base_element.html(`
      <div name="menu-btn-group" class="d-flex">
        <div name="access"></div>
        <button type="button" name="clock" class="btn btn-outline-light">
          <i class="bi bi-clock-fill"></i>
          <span name="time" class="nav-item"></span>
        </button>
      </div>
    `);
    this.#main_menu_header_el.querySelector("div.container-fluid").append(this.#menu_btn_group_el);

    this.#main_menu_offcanvas_el = CN_base_element.html(`
      <div
        class="offcanvas offcanvas-top h-auto"
        id="main-menu-offcanvas"
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
    `);
    this.#menu_el = this.#main_menu_offcanvas_el.querySelector("div[name=menu]");
    this.#main_content_el = CN_base_element.html('<div class="container-fluid my-2"></div>');
    document.querySelector("div[name=app-body]").replaceChildren(
      this.#main_menu_header_el,
      this.#main_menu_offcanvas_el,
      this.#main_content_el,
    );
    this.#main_menu_offcanvas_bs = new bootstrap.Offcanvas(this.#main_menu_offcanvas_el);

    const access_el = this.#main_menu_header_el.querySelector("div[name=access]");
    const access_count = await CN_api.count("self/0/access");
    if (1 == access_count) {
      access_el.append(CN_base_element.html(`
        <div class="text-bg-primary mx-1 p-2">
          ${CN_common.uc_words(this.#data.role.name)} @ ${this.#data.site.name}
        </div>
      `));
    } else {
      const access_btn_el = CN_base_element.html(`
        <button type="button" name="access" class="btn btn-outline-light mx-1">
          ${CN_common.uc_words(this.#data.role.name)} @ ${this.#data.site.name}
        </button>
      `);
      access_btn_el.addEventListener("click", async () => {
        this.close_menu();
        const response = await CN_modal_site_role.create_and_open();
        if (
          null != response &&
          (this.#data.site.id != response.site_id || this.#data.role.id != response.role_id)
        ){
          await CN_api.patch("self/0", { site: { id: response.site_id }, role: { id: response.role_id } });
          this.reload(true);
        }
      });
      access_el.append(access_btn_el);
    }

    // keep the clock running
    const time_el = this.#main_menu_header_el.querySelector("span[name=time]");
    const update_clock = () => {
      // If the user's selected TZ does not match their computer then offset the time
      const datetime = CN_common.format_time(CN_common.get_date());
      const tz = Intl.DateTimeFormat(
        'en-CA',
        { timeZone: this.#data.user.timezone, timeZoneName: "short" }
      ).formatToParts(CN_common.get_date()).find(o => o.type == "timeZoneName").value;
      time_el.innerHTML = `${datetime} ${tz}`;
    };
    update_clock();
    setInterval(update_clock, 1000);

    // wire up the clock and menu buttons
    const clock_el = this.#main_menu_header_el.querySelector("button[name=clock]");
    clock_el.addEventListener("click", async () => {
      this.close_menu();
      const response = await CN_modal_clock_settings.create_and_open();
      if (null != response) await this.set_timezone(response.timezone, response.am_pm);
    });
    const account_btn_el = this.#main_menu_offcanvas_el.querySelector("button[name=account]");
    account_btn_el.addEventListener("click", async () => {
      this.close_menu();
      const response = await CN_modal_account.create_and_open();
      if (
        null != response &&
        this.#data.user.first_name != response.first_name &&
        this.#data.user.last_name != response.last_name &&
        this.#data.user.email != response.email
      ) {
        await CN_api.patch("self/0", { user: response });
        this.#data.user = { ...this.#data.user, ...response };
      }
    });
    const timezone_btn_el = this.#main_menu_offcanvas_el.querySelector("button[name=timezone]");
    timezone_btn_el.addEventListener("click", async () => {
      this.close_menu();
      const response = await CN_modal_clock_settings.create_and_open();
      if (null != response) await this.set_timezone(response.timezone, response.am_pm);
    });
    const password_btn_el = this.#main_menu_offcanvas_el.querySelector("button[name=password]");
    password_btn_el.addEventListener("click", async () => {
      this.close_menu();
      if (await CN_modal_password.create_and_open()) {
        await CN_modal_message.create_and_open({
          title: "Password Changed",
          message: "Your password has been successfully changed.",
        });
      }
    });
    const logout_btn_el = this.#main_menu_offcanvas_el.querySelector("button[name=logout]");
    logout_btn_el.addEventListener("click", async () => {
      this.close_menu();
      await this.#logout();
    });

    // determine the column width of each sub-menu
    const split_lists = null != this.#data.menu.lists && 20 <= Object.keys(this.#data.menu.lists).length;
    const total_menus = (
      (null == this.#data.menu.lists ? 0 : 1) +
      (null == this.#data.menu.utilities ? 0 : 1) +
      (null == this.#data.menu.reports ? 0 : 1)
    );
    const col_width = 1 < total_menus ?  12/(total_menus + (split_lists?1:0)) : null;

    // build the lists sub-menu
    if (null != this.#data.menu.lists) {
      const sub_menu_el = CN_base_element.html(`
        <div name="lists">
          <div class="btn-group-vertical w-100">
            <button type="button" class="btn btn-primary">Lists</button>
          </div>
        </div>
      `);
      CN_base_element.set_disabled(sub_menu_el.querySelector("button"), true);
      if (null != col_width) sub_menu_el.classList.add(`col-${split_lists ? 2*col_width : col_width}`);
      this.#menu_el.append(sub_menu_el);

      const btn_group_el = sub_menu_el.querySelector("div.btn-group-vertical");
      if (split_lists) {
        btn_group_el.append(CN_base_element.html(`
          <div class="row w-100 g-0">
            <div name="a" class="col btn-group-vertical pe-0"></div>
            <div name="b" class="col btn-group-vertical ps-0"></div>
          </div>
        `));
      }

      const lists_total = Object.keys(this.#data.menu.lists).length;
      let index = 0;
      for (const title in this.#data.menu.lists) {
        const name = this.#data.menu.lists[title];
        let side = null;
        let rounded = "";
        if (split_lists) {
          side = 2*index < lists_total ? "a" : "b";
          if (0 == index || Math.ceil(lists_total/2) == index) {
            rounded = "rounded-0";
          } else if ("a" == side) {
            rounded = "rounded-end-0";
          } else { // "b" == side
            rounded = "rounded-start-0";
          }
        }
        const btn_el = CN_base_element.html(`
          <button name="${name}.list" type="button" class="btn btn-outline-primary ${rounded}">${title}</button>
        `);
        btn_el.addEventListener("click", async () => {
          this.close_menu();
          await this.navigate_to(`${name}/list`);
        });

        // split lists need to distribute menu items across two button groups
        const parent_el = (
          split_lists ?
          btn_group_el.querySelector(`[name=${side}]`) :
          btn_group_el
        );
        parent_el.append(btn_el);

        index++;
      }
    }

    // build the utilities sub-menu
    if (null != this.#data.menu.utilities) {
      const sub_menu_el = CN_base_element.html(`
        <div name="utilities">
          <div class="btn-group-vertical w-100">
            <button type="button" class="btn btn-primary">Utilities</button>
          </div>
        </div>
      `);
      CN_base_element.set_disabled(sub_menu_el.querySelector("button"), true);
      if (null != col_width) sub_menu_el.classList.add(`col-${col_width}`);
      this.#menu_el.append(sub_menu_el);

      const btn_group_el = sub_menu_el.querySelector("div.btn-group-vertical");
      for (const title in this.#data.menu.utilities) {
        const utility = this.#data.menu.utilities[title];
        const btn_el = CN_base_element.html(`
          <button
            name="${utility.subject}.${utility.action}"
            type="button"
            class="btn btn-outline-primary"
          >${title}</button>
        `);
        btn_el.addEventListener("click", async () => {
          this.close_menu();
          await this.navigate_to(`${utility.subject}/${utility.action}`);
        });
        btn_group_el.append(btn_el);
      }
    }

    // build the reports sub-menu
    if (null != this.#data.menu.reports) {
      const sub_menu_el = CN_base_element.html(`
        <div name="reports">
          <div class="btn-group-vertical w-100">
            <button type="button" class="btn btn-primary">Reports</button>
          </div>
        </div>
      `);
      CN_base_element.set_disabled(sub_menu_el.querySelector("button"), true);
      if (null != col_width) sub_menu_el.classList.add(`col-${col_width}`);
      this.#menu_el.append(sub_menu_el);

      const btn_group_el = sub_menu_el.querySelector("div.btn-group-vertical");
      for (const title in this.#data.menu.reports) {
        const id = this.#data.menu.reports[title];
        const btn_el = CN_base_element.html(`
          <button
            name="${null == id ? "custom_report.list" : "report_type.view." + id}"
            type="button"
            class="btn btn-outline-primary"
          >${title}</button>
        `);
        btn_el.addEventListener("click", async () => {
          this.close_menu();
          await this.navigate_to(null == id ? "custom_report/list" : `report_type/view/${id}`);
        });
        btn_group_el.append(btn_el);
      }
    }
  }
}

// Now create the session singleton and export it
const CN_session = new session();
export { CN_session };
