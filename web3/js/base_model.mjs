import CN_common from "./common.mjs"
import CN_element from "./element.mjs"
import CN_session from "./session.mjs"

import { CN_base_object } from "./base_object.mjs"

export class CN_base_model extends CN_base_object {
  #unique_id;
  #module;
  #wording;
  #element;
  #actions = { add: null, list: null, view: null };

  /**
   * Constructor
   *
   * @param object params: An object with the properties defining the model (wording, columns and properties)
   */
  constructor(params) {
    super();

    if (!params.wording) throw new Error("Tried to create model with the wording property.");

    const module_name = this.get_class_name().match(/CN_(.+)_model/)[1];
    this.#module = CN_session.get_module(module_name);
    this.#unique_id = [this.get_name(), Math.round(Math.random()*10000000000)].join("-");
    this.#wording = params.wording;

    // send the columns to the list action
    if (params.columns) this.#actions.list = this.#module.create_list(this, params.columns);

    // send the properties to the record actions (add and view)
    if (params.properties) {
      this.#actions.add = this.#module.create_add(this, params.properties);
      this.#actions.view = this.#module.create_view(this, params.properties);
    }
  }

  // access methods
  get_module() { return this.#module; }
  get_element() { return this.#element; }
  get_unique_id() { return this.#unique_id; }
  get_add_action() { return this.#actions.add; };
  get_list_action() { return this.#actions.list; };
  get_view_action() { return this.#actions.view; };
  get_name() { return this.#module.get_name(); }
  get_singular() { return this.#wording.singular; }
  get_plural() { return this.#wording.plural; }
  get_posessive() { return this.#wording.posessive; }
  get_parent_module() { return this.#module.get_parent_module(); }
  get_list_url() { return this.get_base_path("url") + "/list"; }
  get_add_url() { return this.get_base_path("url") + "/add"; }
  get_view_url(id = null, type = "url") {
    if (null == id) id = this.#module.get_identifier();
    return `${this.get_base_path(type)}/${"url" == type ? "view/" : ""}${id}`;
  }

  /**
   * Returns the model's base URL or API path
   * @param string type: Either "url" or "api"
   * @return string
   */
  get_base_path(type) {
    let path_parts = [this.get_name()];
    const parent_module = this.get_parent_module();
    if (parent_module) {
      path_parts.unshift(parent_module.get_identifier());
      if ("url" == type) {
        path_parts.unshift("view");
        path_parts.unshift(parent_module.get_model().get_base_path(type));
      } else {
        path_parts.unshift(parent_module.get_name());
      }
    }

    return path_parts.join("/");
  }

  /**
   * Determines whether the add, delete, edit or view actions are permitted
   */
  allow_add() { return this.#module.action_allowed("add"); }
  allow_delete() { return this.#module.action_allowed("delete"); }
  allow_edit() { return this.#module.action_allowed("edit"); }
  allow_view() { return this.#module.action_allowed("view"); }

  /**
   * Creates the model's element including the header, body and footer sub-elements
   * @param string action: Optionally render a specific action
   * @return Element
   */
  render(action = null) {
    this.#element = CN_element.create(`<div id="${this.#unique_id}" name="model"></div>`);

    // determine which action to use
    if (null == action) action = this.#module.get_action();

    // add the model_action
    if ("add" == action) {
      this.#element.append(this.#actions.add.render());
    } else if ("list" == action) {
      this.#element.append(this.#actions.list.render());
    } else if ("view" == action) {
      this.#element.append(this.#actions.view.render());
    }

    return this.#element;
  }

  /**
   * Runs the dynamic parts of the model (loading data) and updates the element once ready
   * @param string action: Optionally render a specific action
   */
  async run(action = null) {
    // determine which action to use
    if (null == action) action = this.#module.get_action();

    if ("add" == action) {
      await this.#actions.add.run();
    } else if ("list" == action) {
      await this.#actions.list.run();
    } else if ("view" == action) {
      await this.#actions.view.run(true); // also render children
    }
  }
}
