// SESSION

import CN_api from "./api.mjs"
import CN_common from "./common.mjs"

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
  #framework = false;
  #notations = {};
  #properties = {};
  #actions = {};
  #children = [];
  #choosing = [];
  #classes;

  /**
   * Constructor
   * @param object params: The module properties returned from the server.
   */
  constructor(params) {
    super();
    this.#name = params.subject;
    if (params.hasOwnProperty("root")) this.#root = params.root;
    if (params.hasOwnProperty("framework")) this.#framework = params.framework;
    if (params.hasOwnProperty("notations")) this.#notations = params.notations;
    if (params.hasOwnProperty("properties")) this.#properties = params.properties;
    if (params.hasOwnProperty("actions")) this.#actions = params.actions;
    if (params.hasOwnProperty("children")) this.#children = params.children.sort();
    if (params.hasOwnProperty("choosing")) this.#choosing = params.choosing.sort();
  }

  get_action(name) { return this.#actions[name]; }

  get_name() { return this.#name; }
  is_root() { return this.#root; }
  is_framework() { return this.#framework; }
  action_allowed(action) { return this.#actions.hasOwnProperty(action); }
  has_notation(type) { return this.#notations.hasOwnProperty(type); }
  get_notation(type) { return this.has_notation(type) ? this.#notations[type] : null; }
  has_property(name) { return this.#properties.hasOwnProperty(name); }
  get_property(name) { return this.#properties[name]; }
  has_child(module_name) { return this.#children.includes(module_name); }
  get_children() { return this.#children; }
  has_choose(module_name) { return this.#choosing.includes(module_name); }
  get_choosing() { return this.#choosing; }
  create_model() { return new this.#classes.model(); }
  action_class_exists(name) { return CN_common.is_class(this.#classes[name]); }
  create_action(name, model) { return new this.#classes[name](model); }

  /**
   * Updates a notation
   */
  async set_notation(type, description) {
    if (CN_common.is_string(description) && 0 == description.length) description = null;
    const current_description = this.get_notation(type);
    if (description == current_description) return;

    const application_type_id = this.#framework ? null : CN_session.data.application.application_type_id;
    const path = `notation/application_type_id=${application_type_id};subject=${this.#name};type=${type}`;

    if (!description) {
      await CN_api.delete(path);
    } else {
      if (current_description) {
        await CN_api.patch(path, { description: description });
      } else {
        await CN_api.post("notation", {
          application_type_id: application_type_id,
          subject: this.#name,
          type: type,
          description: description,
        });
      }
    }

    this.#notations[type] = description;
  }

  /**
   * Loads all classes used by this module including the model and all actions
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
      let exports = await import(`./model/${this.#name}.mjs`);
      for (const name in exports) {
        const re = new RegExp(`^${prefix}_([a-z][a-z0-9_]*)`);
        const matches = name.match(re);
        if (null == matches) {
          console.warn(`Found unexpected export "${name}" in framework ${this.#name} model.`);
        } else if (!CN_common.is_class(exports[name])) {
          console.warn(`Found non-class export "${name}" in framework ${this.#name} model.`);
        } else {
          const class_name = matches[1];
          this.#classes[class_name] = exports[name];
        }
      }

      // now load the application classes and use any that are found
      exports = await import(`${ROOT_URL}/js/model/${this.#name}.mjs`);
      for (const name in exports) {
        const re = new RegExp(`^${prefix}_([a-z][a-z0-9_]*)`);
        const matches = name.match(re);
        if (null == matches) {
          console.warn(`Found unexpected export "${name}" in application ${this.#name} model.`);
        } else if (!CN_common.is_class(exports[name])) {
          console.warn(`Found non-class export "${name}" in application ${this.#name} model.`);
        } else {
          const class_name = matches[1];
          this.#classes[class_name] = exports[name];
        }
      }
    }
  }
}
