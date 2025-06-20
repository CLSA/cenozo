import CN_common from "./common.mjs"
import CN_element from "./element.mjs"
import CN_session from "./session.mjs"

import { CN_base_object } from "./base_object.mjs"

export class CN_base_model extends CN_base_object {
  #unique_id;
  #module;
  #name;
  #element;
  #actions = {
    add: null,
    list: null,
    view: null,
  };

  // getters and setters
  get unique_id() { return this.#unique_id; }
  get module() { return this.#module; }
  get name() { return this.#name; }
  get element() { return this.#element; }
  get actions() { return this.#actions; }

  // convenience methods
  get_parent_module() { return this.#module.operation.parent_module; }
  get_list_url() { return this.get_base_path("url") + "/list"; }
  get_add_url() { return this.get_base_path("url") + "/add"; }
  get_view_url(id = null) {
    if (null == id) id = this.#module.operation.identifier;
    return this.get_base_path("url") + `/view/${id}`;
  }

  /**
   * Returns the model's base URL or API path
   * @param string type: Either "url" or "api"
   * @return string
   */
  get_base_path(type) {
    let path_parts = [this.#module.subject];
    const parent_module = this.get_parent_module();
    if (parent_module) {
      path_parts.unshift(parent_module.operation.identifier);
      if ("url" == type) {
        path_parts.unshift("view");
        path_parts.unshift(parent_module.model.get_base_path(type));
      } else {
        path_parts.unshift(parent_module.subject);
      }
    }

    return path_parts.join("/");
  }

  /**
   * Constructor
   *
   * @param object module: The model's module (as defined in session.mjs)
   * @param object params: An object with the properties defining the model (name, columns and properties)
   */
  constructor(module, params) {
    super();

    if (!params.name) throw new Error("Tried to create model with the name property.");

    this.#unique_id = [module.subject, Math.round(Math.random()*10000000000)].join("-");
    this.#module = module;
    this.#name = params.name;

    // send the columns to the list action
    if (params.columns) this.#actions.list = new this.#module.classes.list(this, params.columns);

    // send the properties to the record actions (add and view)
    if (params.properties) {
      this.#actions.add = new this.#module.classes.add(this, params.properties);
      this.#actions.view = new this.#module.classes.view(this, params.properties);
    }
  }

  /**
   * Determines whether the add, delete, edit or view actions are permitted
   */
  allow_add() { return this.module.action_allowed("add"); }
  allow_delete() { return this.module.action_allowed("delete"); }
  allow_edit() { return this.module.action_allowed("edit"); }
  allow_view() { return this.module.action_allowed("view"); }

  /**
   * Creates the model's element including the header, body and footer sub-elements
   * @param string action: Optionally render a specific action
   * @return Element
   */
  render(action = null) {
    this.#element = CN_element.create(`<div id="${this.#unique_id}" name="model"></div>`);

    // determine which action to use
    if (null == action && this.#module.hasOwnProperty("operation")) action = this.#module.operation.action;

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
    if (null == action && this.#module.hasOwnProperty("operation")) action = this.#module.operation.action;

    if ("add" == action) {
      await this.#actions.add.run();
    } else if ("list" == action) {
      await this.#actions.list.run();
    } else if ("view" == action) {
      await this.#actions.view.run(true); // also render children
    }
  }
}
