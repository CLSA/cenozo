import CN_common from "./common.mjs"
import CN_element from "./element.mjs"
import CN_session from "./session.mjs"

import { CN_base_object } from "./base_object.mjs"

export class CN_base_model extends CN_base_object {
  #unique_id;
  #module;
  #wording;
  #properties_template;
  #columns_template;
  #element = null;
  #parent_model = null;
  #child_model_list = [];
  #action_name = null;
  #identifier = null;
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
    this.#unique_id = [
      this.get_name(),
      [...Array(4)].map(() => Math.floor(Math.random()*16).toString(16)).join('')
    ].join("-");
    this.#wording = params.wording;

    // Note that the properties and columns props are only used when configuring the model.
    this.#properties_template = params.properties;
    this.#columns_template = params.columns;
  }

  // access methods
  get_module() { return this.#module; }
  get_element() { return this.#element; }
  get_unique_id() { return this.#unique_id; }
  get_parent_model() { return this.#parent_model; }
  get_child_model_list() { return this.#child_model_list; }
  get_action_name() { return this.#action_name; }
  get_identifier() { return this.#identifier; }
  get_action() { return this.#action; }
  get_name() { return this.#module.get_name(); }
  get_singular() { return this.#wording.singular; }
  get_plural() { return this.#wording.plural; }
  get_posessive() { return this.#wording.posessive; }
  get_list_url() { return this.get_base_path("url") + "/list"; }
  get_add_url() { return this.get_base_path("url") + "/add"; }
  get_view_url(id = null, type = "url") {
    if (null == id) id = this.#identifier;
    return [
      this.get_base_path(type),
      ("url" == type ? "view/" : "") + id,
    ].join("/");
  }

  /**
   * Returns the model's base URL or API path
   * @param string type: Either "url" or "api"
   * @return string
   */
  get_base_path(type) {
    return this.get_base_path_parts(type).join("/");
  }

  /**
   * Returns the all of the parts of a model's base URL or API path as an array
   * @param string type: Either "url" or "api"
   * @return array
   */
  get_base_path_parts(type) {
    let path_parts = [this.get_name()];
    const parent_model = this.get_parent_model();
    if (parent_model) {
      path_parts.unshift(parent_model.get_identifier());
      if ("url" == type) {
        const parent_path_parts = parent_model.get_base_path_parts(type);
        parent_path_parts.push("view");

        // Note: if this model's name is found in the parent's path parts after "view", then we have a path loop.
        // We correct loops by removing all parts of the path that happen before the loop began.  For example:
        // a/view/1/b/view/2/c/view/3/b/view/4 becomes c/view/3/b/view/4
        // (because subject "b" appears twice in the URL)

        // note the index if we find the current model's name in the parent's base path parts
        let last_part = null;
        let matching_index = null;
        for(let index = 0; index < parent_path_parts.length; index++) {
          let part = parent_path_parts[index];
          if (this.get_name() == last_part && "view" == part) {
            matching_index = index;
            break;
          }
          last_part = part;
        }

        if (null == matching_index) {
          // if there's no matching index then simply prepend the parent's base path parts
          path_parts.unshift(...parent_path_parts);
        } else {
          // if there's a match then only append the parent's base path parts that come after the matching model name
          path_parts.unshift(...parent_path_parts.slice(matching_index+2));
        }
      } else {
        path_parts.unshift(parent_model.get_name());
      }
    }

    return path_parts;
  }

  /**
   * Configures the model's action
   */
  configure(action_name, identifier=null, parent_model=null) {
    this.#action_name = action_name;
    this.#identifier = identifier;
    this.#parent_model = parent_model;

    // validate and create the action, if possible
    const allow_fn = `allow_${action_name}`;
    let problem = null;
    if (CN_common.is_function(this[allow_fn]) && !this[allow_fn]()) {
      problem = "is not allowed";
    } else if (!CN_common.is_function(this[allow_fn]) && !this.#module.action_allowed(action_name)) {
      problem = "is not allowed or doesn't exist";
    } else {
      // make sure the action-query matches the identifier
      const has_identifier = this.#module.action_has_identifier(action_name);
      if (null == identifier && has_identifier) {
        problem = "requires an identifier but none provided";
      } else if (null != identifier && !has_identifier) {
        problem = "does not require an identifier but one was provided";
      } else if (!this.#module.action_class_exists(action_name)) {
        problem = "is not implemented in the model";
      } else {
        this.#action = this.#module.create_action(action_name, this);
      }
    }

    if (problem) {
      const error = new URIError();
      error.message = `Error configuring ${this.get_name()} model: "${action_name}" action ${problem}.`;
      throw error;
    }
  }

  /**
   * Creates and configures the model's child and choose models
   */
  configure_children() {
    // create and configure all child and choosing models
    this.#child_model_list = this.#module.get_children().concat(this.#module.get_choosing()).map(name => {
      const model = CN_session.get_module(name).create_model();
      model.configure("list", null, this);
      return model;
    });
  }

  /**
   * Creates a clone of the properties template object (defined by implementing classes)
   * @return object
   */
  clone_properties() { return CN_common.clone(this.#properties_template); }

  /**
   * Creates a clone of the columns template object (defined by implementing classes)
   * @return object
   */
  clone_columns() { return CN_common.clone(this.#columns_template); }

  /**
   * Determines whether the add, delete, edit or view actions are permitted
   *
   * Note that though these rules come from the module we only refer to the module.action_allowed()
   * methods here as these allow_*() methods may be overridden, but the module's action_allowed()
   * methods cannot be overridden.
   */
  allow_add() { return this.#module.action_allowed("add"); }
  allow_choose() { return null == this.#parent_model || this.#parent_model.allow_edit(); }
  allow_delete() { return this.#module.action_allowed("delete"); }
  allow_edit() { return this.#module.action_allowed("edit"); }
  allow_list() { return this.#module.action_allowed("list"); }
  allow_view() { return this.#module.action_allowed("view"); }

  /**
   * Creates the model's element
   * @return Element
   */
  render() {
    this.#element = null == this.#action ? CN_element.create("<div></div>") : this.#action.render();
    this.#element.id = this.#unique_id;
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
