import CN_common from "./common.mjs"
import CN_element from "./element.mjs"
import CN_session from "./session.mjs"

import { CN_base_object } from "./base_object.mjs"

export class CN_base_model extends CN_base_object {
  #unique_id;
  #module;
  #wording;
  #element;
  #action = null;

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

    const action_name = this.#module.get_action_name();
    const identifier = this.#module.get_identifier();

    if ("add" == action_name) {
      if (null != identifier) {
        console.error(`The ADD action for the ${this.get_name()} module has an identifier (${identifier}).`);
      }
      this.#action = this.#module.create_add(this, params.properties);
    } else if ("list" == action_name) {
      if (null != identifier) {
        console.error(`The LIST action for the ${this.get_name()} module has an identifier (${identifier}).`);
      }
      this.#action = this.#module.create_list(this, params.columns);
    } else if ("view" == action_name) {
      if (null == identifier) {
        console.error(`The VIEW action for the ${this.get_name()} module has no identifier.`);
      }
      this.#action = this.#module.create_view(this, params.properties);
    }
  }

  // access methods
  get_module() { return this.#module; }
  get_element() { return this.#element; }
  get_unique_id() { return this.#unique_id; }
  get_action() { return this.#action; }
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
   * @return Element
   */
  render() {
    this.#element = CN_element.create(`<div id="${this.#unique_id}" name="model"></div>`);
    if (null != this.#action) this.#element.append(this.#action.render());
    return this.#element;
  }

  /**
   * Runs the dynamic parts of the model (loading data) and updates the element once ready
   */
  async run() {
    // run the model's action and its children
    if (null != this.#action) await this.#action.run(true);
  }
}
