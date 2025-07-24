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
  #root = false;
  #properties = {};
  #actions = {};
  #children = [];
  #choosing = [];
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
  is_root() { return this.#root; }
  action_allowed(action) { return this.#actions.hasOwnProperty(action); }
  has_property(name) { return this.#properties.hasOwnProperty(name); }
  get_property(name) { return this.#properties[name]; }
  has_child(module_name) { return this.#children.includes(module_name); }
  get_children() { return this.#children; }
  has_choose(module_name) { return this.#choosing.includes(module_name); }
  get_choosing() { return this.#choosing; }
  create_model() { return new this.#classes.model(); }
  create_add(model) { return new this.#classes.add(model); }
  create_list(model) { return new this.#classes.list(model); }
  create_view(model) { return new this.#classes.view(model); }

  /**
   * ADD DOCS
   */
  async load_classes() {
    // only load if the classes haven't already been loaded
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
