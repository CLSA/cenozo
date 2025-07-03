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

  get_name() { return this.#name; }
  action_allowed(action) { return this.#actions.hasOwnProperty(action); }
  get_action_name() { return null == this.#operation ? null : this.#operation.action; }
  get_identifier() { return null == this.#operation ? null : this.#operation.identifier; }
  get_parent_module() {
    return (
      null == this.#operation || null == this.#operation.parent ?
      null :
      CN_session.get_module(this.#operation.parent)
    );
  }
  get_model() { return this.#model; }
  has_property(name) { return this.#properties.hasOwnProperty(name); }
  get_property(name) { return this.#properties[name]; }
  has_child(module_name) { return this.#children.includes(module_name); }
  get_children() { return this.#children; }
  has_choose(module_name) { return this.#choosing.includes(module_name); }
  get_choosing() { return this.#choosing; }
  reset_operation() { if (null != this.#operation) this.#operation = null; }

  create_model() { this.#model = new this.#classes.model(); }
  create_add(model, properties) { return new this.#classes.add(model, properties); }
  create_list(model, columns) { return new this.#classes.list(model, columns); }
  create_view(model, properties) { return new this.#classes.view(model, properties); }

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
    if (!CN_common.is_object(this.#classes)) {
      const prefix = `CN_${this.#name}`;
      this.#classes = {
        model: null,
        add: CN_base_add,
        list: CN_base_list,
        view: CN_base_view,
      };

      // load the framework classes and use any that are found
      let classes = await import(`./model/${this.#name}.mjs`);
      for (const item in classes) {
        if (`${prefix}_model` == item) {
          this.#classes.model = classes[item];
        } else if (`${prefix}_add` == item) {
          this.#classes.add = classes[item];
        } else if (`${prefix}_list` == item) {
          this.#classes.list = classes[item];
        } else if (`${prefix}_view` == item) {
          this.#classes.view = classes[item];
        } else {
          console.warn(`Found unexpected export "${item}" in framework ${this.#name} model.`);
        }
      }

      // now load the application specific classes and use any that are found
      classes = await import(`${ROOT_URL}/js/model/${this.#name}.mjs`);
      for (const item in classes) {
        if (`${prefix}_model` == item) {
          this.#classes.model = classes[item];
        } else if (`${prefix}_add` == item) {
          this.#classes.add = classes[item];
        } else if (`${prefix}_list` == item) {
          this.#classes.list = classes[item];
        } else if (`${prefix}_view` == item) {
          this.#classes.view = classes[item];
        } else {
          console.warn(`Found unexpected export "${item}" in application ${this.#name} model.`);
        }
      }
    }
  }
}
