// SESSION

import CN_api from "./api.mjs"
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
    if (params.hasOwnProperty("children")) this.#children = params.children.sort();
    if (params.hasOwnProperty("choosing")) this.#choosing = params.choosing.sort();

    // parse the action parameters
    if (params.hasOwnProperty("actions")) {
      for(const action_name in params.actions) {
        // separate the query parameters into pre-query and post-query
        const parts = params.actions[action_name].match(/^([^?]*)\??(.*)$/);
        this.#actions[action_name] = {
          // the identifier can only be named "identifier"
          identifier: "/{identifier}" == parts[1],
          // split the query parameters into arguments (all will be enclosed in {})
          query_list: parts[2]
            .split("&")
            .filter(x => x.match(/^{[^{}]+}$/)) // only match arguments enclosed in {}
            .map(x => x.replace(/^{([^{}]+)}$/, "$1")), // remove the {} enclosing the argument
        };
      }
    }
  }

  action_allowed(action) { return this.#actions.hasOwnProperty(action); }
  action_has_identifier(name) {
    if (!this.action_allowed(name)) {
      throw new Error(`Tried to get query identifier details for invalid action "${name}"`);
    }
    return this.#actions[name].identifier;
  }
  get_action_query_parameter(name, key) {
    if (!this.action_allowed(name)) {
      throw new Error(`Tried to get query parameter "${key}" for invalid action "${name}"`);
    } else if (!this.#actions[name].query_list.includes(key)) {
      throw new Error(`Tried to get invalid query parameter "${key}" for action "${name}"`);
    }

    return (new URL(window.location)).searchParams.get(key);
  }
  set_action_query_parameter(name, key, value) {
    if (!this.action_allowed(name)) {
      throw new Error(`Tried to set query parameter "${key}" for invalid action "${name}"`);
    } else if (!this.#actions[name].query_list.includes(key)) {
      throw new Error(`Tried to set invalid query parameter "${key}" for action "${name}"`);
    }

    const params = (new URL(window.location)).searchParams;
    if (null === value) {
      params.delete(key);
    } else {
      params.set(key, value);
      params.sort();
    }

    window.history.replaceState(null, null, `?${params.toString()}`);
  }
  get_name() { return this.#name; }
  is_root() { return this.#root; }
  is_framework() { return this.#framework; }
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
      if (this.#framework) {
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
      }

      // now load the application classes and use any that are found
      let exports = await import(`${ROOT_URL}/js/model/${this.#name}.mjs`);
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
