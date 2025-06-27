// SESSION

import CN_common from "./common.mjs"
import CN_session from "./session.mjs"

import { CN_base_add } from "./base_add.mjs"
import { CN_base_list } from "./base_list.mjs"
import { CN_base_object } from "./base_object.mjs"
import { CN_base_view } from "./base_view.mjs"

/**
 * The session class which handles the application
 */
export class CN_module extends CN_base_object {
  #name;
  #model;
  #root = false;
  #properties = {};
  #actions = {};
  #children = [];
  #choosing = [];
  #operation = null;
  #classes;

  /**
   * ADD DOCS
   */
  constructor(params) {
    super();
    this.#name = params.subject;
    if (params.hasOwnProperty("root")) this.#root = params.root;
    if (params.hasOwnProperty("properties")) this.#properties = params.properties;
    if (params.hasOwnProperty("actions")) this.#actions = params.actions;
    if (params.hasOwnProperty("children")) this.#children = params.children.sort();
    if (params.hasOwnProperty("choosing")) this.#choosing = params.choosing.sort();
  }

  /**
   * ADD DOCS
   */
  get_name() { return this.#name; }

  /**
   * ADD DOCS
   */
  action_allowed(action) { return this.#actions.hasOwnProperty(action); }

  /**
   * ADD DOCS
   */
  get_action() { return null == this.#operation ? null : this.#operation.action; }

  /**
   * ADD DOCS
   */
  get_identifier() { return null == this.#operation ? null : this.#operation.identifier; }

  /**
   * ADD DOCS
   */
  get_parent_module() {
    return (
      null == this.#operation || null == this.#operation.parent ?
      null :
      CN_session.get_module(this.#operation.parent)
    );
  }

  /**
   * ADD DOCS
   */
  get_model() { return this.#model; }

  /**
   * ADD DOCS
   */
  has_property(name) { return this.#properties.hasOwnProperty(name); }

  /**
   * ADD DOCS
   */
  get_property(name) { return this.#properties[name]; }

  /**
   * ADD DOCS
   */
  has_child(module_name) { return this.#children.includes(module_name); }

  /**
   * ADD DOCS
   */
  get_children() { return this.#children; }

  /**
   * ADD DOCS
   */
  has_choose(module_name) { return this.#choosing.includes(module_name); }

  /**
   * ADD DOCS
   */
  get_choosing() { return this.#choosing; }

  /**
   * ADD DOCS
   */
  reset_operation() { if (null != this.#operation) this.#operation = null; }

  /**
   * ADD DOCS
   */
  set_operation_parent(name) {
    if (null == this.#operation) this.#operation = { parent: null, action: null };
    this.#operation.parent = name;

    if (null == name) {
      // make sure that only root modules have an operation with no parent
      if (!this.#root) return false;
    } else {
      // make sure the parent exists and has this module as a child
      const parent_module = CN_session.get_module(name);
      if (null == parent_module) {
        throw new Error(`Tried to set parent module "${name}" that doesn't exist.`);
      } else if (!parent_module.has_child(this.#name) && !parent_module.has_choose(this.#name)) {
        throw new Error(`Parent/child module mismatch: "${this.#name}" does not belong to "${name}".`);
      }
    }

    return true;
  }

  /**
   * ADD DOCS
   */
  set_operation_action(action) {
    if (null == this.#operation) this.#operation = { parent: null, action: null };
    this.#operation.action = action;

    // validate the module's action
    if (!this.action_allowed(action)) {
      return "not allowed";
    }

    // if viewing then setup all child modules
    if ("view" == action) {
      this.#children.concat(this.#choosing).forEach(child_name => {
        const child_module = CN_session.get_module(child_name);
        if (child_module) {
          child_module.set_operation_parent(this.#name);
          child_module.set_operation_action("list");
        }
      });
    }

    return null;
  }

  /**
   * ADD DOCS
   */
  set_operation_identifier(identifier) {
    this.#operation.identifier = identifier;
  }

  /**
   * ADD DOCS
   */
  async load_classes() {
    // only load if there's an operation and the classes haven't already been loaded
    if (null != this.#operation && !CN_common.is_object(this.#classes)) {
      const classes = await import(`./model/${this.#name}.mjs`);
      const prefix = `CN_${this.#name}`;
      this.#classes = {
        model: classes[`${prefix}_model`],
        add: classes[`${prefix}_add`] ? classes[`${prefix}_add`] : CN_base_add,
        list: classes[`${prefix}_list`] ? classes[`${prefix}_list`] : CN_base_list,
        view: classes[`${prefix}_view`] ? classes[`${prefix}_view`] : CN_base_view,
      };
    }
  }

  /**
   * ADD DOCS
   */
  create_model() {
    if (CN_common.is_object(this.#operation)) {
      if (null == this.#operation.action) {
        throw new Error(`Module ${this.#name} has no operation action."`);
      } else if (
        this.#operation.hasOwnProperty("identifier") &&
        ["add", "list"].includes(this.#operation.action)
      ) {
        throw new Error(`Module ${this.#name} has identifier for ${this.#operation.action} action`);
      } else if (!this.#operation.hasOwnProperty("identifier") && "view" == this.#operation.action) {
        throw new Error(`Module ${this.#name} has no identifier for "${this.#operation.action}" action`);
      }

      this.#model = new this.#classes.model();
    }
  }

  /**
   * ADD DOCS
   */
  create_add(model, properties) {
    return new this.#classes.add(model, properties);
  }

  /**
   * ADD DOCS
   */
  create_list(model, columns) {
    return new this.#classes.list(model, columns);
  }

  /**
   * ADD DOCS
   */
  create_view(model, properties) {
    return new this.#classes.view(model, properties);
  }
}
