import { CN_action_add } from "./action/add.mjs"
import { CN_action_calendar } from "./action/calendar.mjs"
import { CN_action_list } from "./action/list.mjs"
import { CN_action_notes } from "./action/notes.mjs"
import { CN_action_view } from "./action/view.mjs"
import { CN_api } from "./api.mjs"
import { CN_base_object } from "./base_object.mjs"
import { CN_common } from "./common.mjs"
import { CN_session } from "./session.mjs"

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
  #child_modules = [];
  #choosing_modules = [];
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
    if (params.hasOwnProperty("properties")) {
      this.#properties = params.properties;

      if (CN_common.is_object(this.#properties)) {
        this.get_property_names().forEach(prop_name => {
          const data_type = this.#properties[prop_name].data_type;
          if (data_type.match(/int|float/) && null != this.#properties[prop_name].default) {
            // cast boolean, int and float column defaults from strings to boolean/numbers
            const value = this.#properties[prop_name].default;
            this.#properties[prop_name].default = "tinyint" == data_type ?  "1" == value : Number(value);
          } else if ("enum" == data_type) {
            // get enum lists
            const matches = this.#properties[prop_name].type.match(/^enum\('(.+)'\)$/);
            if (null != matches) {
              this.#properties[prop_name].enum_list = matches[1].split("','");
            }
          }
        });
      }
    }
    if (params.hasOwnProperty("children")) this.#child_modules.push.apply(this.#child_modules, params.children);
    if (params.hasOwnProperty("choosing")) {
      this.#child_modules.push.apply(this.#child_modules, params.choosing);
      this.#choosing_modules = params.choosing;
    }
    this.#child_modules.sort();

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

      // automatically add the report action
      if (this.#actions.list) this.#actions.report = CN_common.clone(this.#actions.list);
    }
  }

  resolve_children() {
    // convert child module names to module objects
    this.#child_modules = this.#child_modules.reduce((list, name) => {
      const module = CN_session.get_module(name);
      if (module) {
        list.push(module);
      } else {
        // remove it from the choosing_modules list (if found)
        const index = this.#choosing_modules.indexOf(name);
        if (-1 !== index) this.#choosing_modules.splice(index, 1);
      }
      return list;
    }, []);
  }

  action_allowed(action) { return this.#actions.hasOwnProperty(action); }
  action_has_identifier(name) {
    if (!this.action_allowed(name)) {
      throw new Error(
        `Tried to get query identifier details for invalid action "${name}" in "${this.#name}" module`
      );
    }
    return this.#actions[name].identifier;
  }
  get_action_query_parameter(name, key) {
    if (!this.action_allowed(name)) {
      throw new Error(
        `Tried to get query parameter "${key}" for invalid action "${name}" in "${this.#name}" module`
      );
    } else if (!this.#actions[name].query_list.includes(key)) {
      throw new Error(
        `Tried to get invalid query parameter "${key}" for action "${name}" in "${this.#name}" module`
      );
    }

    return (new URL(window.location)).searchParams.get(key);
  }
  set_action_query_parameter(name, key, value) {
    if (!this.action_allowed(name)) {
      throw new Error(
        `Tried to set query parameter "${key}" for invalid action "${name}" in "${this.#name}" module`
      );
    } else if (!this.#actions[name].query_list.includes(key)) {
      throw new Error(
        `Tried to set invalid query parameter "${key}" for action "${name}" in "${this.#name}" module`
      );
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
  get_property_names() { return Object.keys(this.#properties); }
  has_property(name) { return this.#properties.hasOwnProperty(name); }
  get_property(name) { return this.#properties[name]; }
  has_choose(module_name) { return this.#choosing_modules.includes(module_name); }
  get_child_modules() { return this.#child_modules; }
  create_model() {
    if (!CN_common.is_class(this.#classes.model)) {
      throw new Error(`Tried to create model for "${this.#name}" module but model class isn't implemented`);
    }
    return new this.#classes.model();
  }
  action_class_exists(name) { return CN_common.is_class(this.#classes[name]); }
  create_action(name, parent_el, model) {
    if (!CN_common.is_class(this.#classes[name])) {
      throw new Error(
        `Tried to create "${name}" action for "${this.#name}" module but action class isn't implemented`
      );
    }
    return new this.#classes[name](parent_el, model);
  }

  /**
   * Updates a notation
   */
  async set_notation(type, description) {
    if (CN_common.is_string(description) && 0 == description.length) description = null;
    const current_description = this.get_notation(type);
    if (description == current_description) return;

    const application_type_id = this.#framework ? null : CN_session.get("application", "application_type_id");
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
      this.#classes = { model: null };
      if (this.action_allowed("add")) this.#classes.add = CN_action_add;
      if (this.action_allowed("calendar")) this.#classes.calendar = CN_action_calendar;
      if (this.action_allowed("list")) this.#classes.list = CN_action_list;
      if (this.action_allowed("notes")) this.#classes.notes = CN_action_notes;
      if (this.action_allowed("view")) this.#classes.view = CN_action_view;

      // load the framework classes and use any that are found
      if (this.#framework) {
        let exports = await import(`./model/${this.#name}.mjs`);
        for (const name in exports) {
          const re = new RegExp(`^CN_([a-z][a-z0-9_]*)_${this.#name}`);
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
        const re = new RegExp(`^CN_([a-z][a-z0-9_]*)_${this.#name}`);
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
