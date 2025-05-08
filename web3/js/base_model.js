import CN_api from "./api.js"
import CN_common from "./common.js"
import CN_element from "./element.js"
import CN_event from "./event.js"
import CN_session from "./session.js"

import { CN_base_object } from "./base_object.js"

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

  // convenience methods
  get_list_url() { return this.get_base_path("url") + "/list"; }
  get_add_url() { return this.get_base_path("url") + "/add"; }
  get_view_url(id = null) {
    if (null == id) id = this.#module.operation.identifier;
    return this.get_base_path("url") + `/view/${id}`;
  }

  /**
   * ADD DOCS
   */
  get_base_path(type) {
    let path_parts = [this.#module.subject];
    const parent_module = this.get_parent_module();
    if (parent_module) {
      path_parts.unshift(parent_module.operation.identifier);
      if ("url" == type) path_parts.unshift("view");
      path_parts.unshift(parent_module.model.get_base_path(type));
    }

    return path_parts.join("/");
  }

  /**
   * ADD DOCS
   */
  constructor(module, params) {
    super();

    if (!params.name) throw new Error("Tried to create model with the name property.");

    this.#unique_id = [module.subject, Math.round(Math.random()*10000000000)].join("-");
    this.#module = module;
    this.#name = params.name;
    if (params.columns) this.#actions.list = new this.#module.classes.list(this, params.columns);
    if (params.properties) {
      // make sure all properties exist in the module
      for (let prop_name in params.properties) {
        if (!this.#module.properties.hasOwnProperty(prop_name)) {
          throw new Error(
            `Model property "${prop_name}" does not exist in parent "${this.#module.subject}" module.`
          );
        }

        if (this.#module.properties[prop_name].type.match(/unsigned/)) {
          params.properties[prop_name].min = 0;
        }
      }

      this.#actions.add = new this.#module.classes.add(this, params.properties);
      this.#actions.view = new this.#module.classes.view(this, params.properties);
    }
  }

  /**
   * ADD DOCS
   */
  render() {
    this.#element = CN_element.create(`<div id="${this.#unique_id}" name="model"></div>`);
    if (!this.#module.operation) return this.#element;

    // add the model_action
    if ("add" == this.#module.operation.action) {
      this.#element.append(this.#actions.add.render());
    } else if ("list" == this.#module.operation.action) {
      this.#element.append(this.#actions.list.render());
    } else if ("view" == this.#module.operation.action) {
      this.#element.append(this.#actions.view.render());
    }

    return this.#element;
  }

  /**
   * ADD DOCS
   */
  async run() {
    if (!this.#module.operation) return;

    if ("add" == this.#module.operation.action) {
      await this.#actions.add.run();
    } else if ("list" == this.#module.operation.action) {
      await this.#actions.list.run();
    } else if ("view" == this.#module.operation.action) {
      await this.#actions.view.run(true); // also render children
    }
  }
}
