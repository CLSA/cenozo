import CN_api from "./api.mjs"
import CN_common from "./common.mjs"
import CN_element from "./element.mjs"
import CN_session from "./session.mjs"

import { CN_base_action } from "./base_action.mjs"

export class CN_base_record extends CN_base_action {
  #properties;

  // getters and setters
  get properties() { return this.#properties }

  /**
   * Constructor
   *
   * TODO: document a full description of the properties parameter
   *
   * @param string type: The type of action (either "add" or "view")
   * @param base_model parent_model: The model that the action belongs to
   * @param object properties: A list of property definitions
   */
  constructor(type, parent_model, properties) {
    super(type, parent_model);

    // setup each property
    const parent_module = this.parent_model.get_parent_module();
    this.#properties = CN_common.clone(properties);
    for (var prop_name in this.#properties) {
      const module_prop = this.parent_model.module.properties[prop_name];
      const prop = this.#properties[prop_name];
      prop.id = [this.parent_model.unique_id, prop_name].join("-");
      prop.name = prop_name;
      prop.state = [];
      if (!prop.type) prop.type = "string";

      // make sure all properties exist in the module
      if (!this.#properties[prop.name].meta_column) {
        if (!this.parent_model.module.properties.hasOwnProperty(prop.name)) {
          throw new Error(
            `Model property "${prop.name}" does not exist in parent "${this.parent_model.module.subject}" module.`
          );
        }

        if (prop.type.match(/unsigned/)) {
          this.#properties[prop.name].min = 0;
        }
      }

      if ("typeahead" == prop.type) {
        if (!prop.typeahead) prop.typeahead = {};
        if (!prop.typeahead.list) prop.typeahead.list = [];
        if (!prop.typeahead.on_select) {
          prop.typeahead.on_select = item => {
            const control_el = document.getElementById(prop.id);
            this.set_state(prop.name, item.value);
            this.commit_state(prop.name);
            if (CN_common.is_function(prop.element.params.onchange)) {
              prop.element.params.onchange(control_el, true, this.get_state(prop.name));
            }
          };
        }
        if (!prop.typeahead.on_cancel) {
          prop.typeahead.on_cancel = () => {
            this.undo_state(prop.name, true);
          }
        }
      }

      if (["integer", "float"].includes(prop.type)) {
        prop.min = prop.hasOwnProperty("min") ? prop.min : null;
        prop.max = prop.hasOwnProperty("max") ? prop.max : null;
      }

      if (!CN_common.is_function(prop.is_constant)) prop.is_constant = () => false;
      if (!CN_common.is_function(prop.is_hidden)) {
        prop.is_hidden = () => parent_module && prop.name.match(`${parent_module.subject}_id`);
      }
      if (!CN_common.is_function(prop.get_default)) {
        // if the column is a reference to the parent then use the parent's id
        prop.get_default = () => (
          parent_module && prop.name.match(`${parent_module.subject}_id`) ?
          parent_module.model.actions.view.get_state("id") :
          (module_prop ? module_prop.default : null)
        );
      }
    }
  }

  /**
   * Gets the value of a state
   * @param string name: The name of the state
   * @return (dynamic)
   */
  get_state(name) {
    const prop = this.#properties[name];
    if (undefined === prop) throw new Error(`Tried to get state value "${name}" which doesn't exist.`);
    const len = prop.state.length;
    return 0 < len ? prop.state[len-1].value : undefined;
  }

  /**
   * Sets the value of a state
   * @param string name: The name of the state
   * @param (dynamic) val: The value to set the state to
   */
  set_state(name, val) {
    const prop = this.#properties[name];
    if (undefined === prop) throw new Error(`Tried to set state value "${name}" which doesn't exist.`);

    const len = prop.state.length;
    const new_state = {value: val, committed: false};

    if (0 < len && !prop.state[len-1].committed) {
      // when the current state isn't committed then simply overwrite it
      prop.state[len-1] = new_state;
    } else {
      // otherwise always add the new state
      prop.state.push(new_state);
    }

    // apply element binding
    const control_el = document.getElementById(prop.id);
    if (control_el) control_el.value = this.get_state(name);
  }

  /**
   * Marks a state's current value as committed to the server
   * @param string name: The name of the state
   */
  commit_state(name) {
    const prop = this.#properties[name];
    if (undefined === prop) throw new Error(`Tried to set state value "${name}" which doesn't exist.`);

    const len = prop.state.length;
    if (0 < len) prop.state[len-1].committed = true;
  }

  /**
   * Clears a state, removing all state history
   * @param string name: The name of the state
   */
  clear_state(name) {
    const prop = this.#properties[name];
    if (undefined === prop) throw new Error(`Tried to set state value "${name}" which doesn't exist.`);

    prop.state = [];
  }

  /**
   * Returns to the state's earlier value
   * @param string name: The name of the state
   * @param boolean committed: Whether to return to the last committed state
   */
  undo_state(name, committed=false) {
    const prop = this.#properties[name];
    if (undefined === prop) throw new Error(`Tried to undo state value "${name}" which doesn't exist.`);

    if (committed) {
      // keep going to the previous state until there are none left or we find one that is committed
      let state = prop.state[prop.state.length-1];
      while (state && !state.committed) {
        prop.state.pop();
        state = prop.state[prop.state.length-1];
      }
    } else {
      // simply go to the previous state
      prop.state.pop();
    }

    // apply element binding
    const control_el = document.getElementById(prop.id);
    if (control_el) control_el.value = this.get_state(name);
  }

  /**
   * Extends parent class
   */
  async on_load() {
    // load dynamic enums
    const promise_list = [];
    for (var prop_name in this.#properties) {
      const module_prop = this.parent_model.module.properties[prop_name];
      const prop = this.#properties[prop_name];

      if ("enum" == prop.type) {
        if (CN_common.is_object(prop.enum) && prop.enum.path) {
          // populate the enum
          const params = {
            select: prop.enum.select ? prop.enum.select : { column: "name" },
            modifier: prop.enum.modifier ? prop.enum.modifier : { order: "name" },
          };

          // create an async function and add it to the promise list so they can be run in parallel
          const get_enums = async () => {
            const response = await CN_api.get(prop.enum.path, params);
            prop.enum.values = (await response.json()).reduce((list, record) => {
              list.push({ key: record.id, value: record.name });
              return list;
            }, []);
          };
          promise_list.push(get_enums());
        } else {
          // enum properties without an enum path use the column definition
          let matches = module_prop ? module_prop.type.match(/^enum\('(.+)'\)$/) : null;
          if (null == matches) throw new Error(`Property ${prop.name} has no valid enum values.`);
          prop.enum = { values: matches[1].split("','").map(v => ({ key: v, value: v })) };
        }
      } else if ("rank" == prop.type) {
        // populate the rank enum based on the max rank
        const params = {
          select: { column: {
            column: `max(${this.parent_model.module.subject}.rank)`,
            alias: "max_rank",
            table_prefix: false
          } },
        };

        const get_max_rank = async () => {
          const response = await CN_api.get(this.parent_model.get_base_path("api"), params);
          const max_rank = (await response.json())[0].max_rank;

          if (!max_rank) throw new Error(`Couldn't get max rank for ${prop.name}.`);
          prop.enum = { values: [] };
          for(let r = 1; r <= max_rank; r++) {
            prop.enum.values.push({ key: r, value: CN_common.ordinal_suffix(r) });
          }
        };
        promise_list.push(get_max_rank());
      }
    }
    await Promise.all(promise_list);
  }

  /**
   * Returns a property's value formatted by its type
   * @param string prop_name: The name of the property
   * @return (dynamic)
   */
  get_formatted_property(prop_name) {
    const prop = this.properties[prop_name];
    let value = this.get_state(prop.name);
    if ("boolean" == prop.type) {
      value = "" == value ? null : Number(value);
    } else if ("date" == prop.type) {
      if ("" == value) value = null;
    } else if ("typeahead" == prop.type) {
      // convert from value to key by looking up the element's typeahead list in the params object
      // NOTE: the element's params is not the same as the property's params object (it is cloned)
      value = prop.element.params.typeahead.list.find(item => value === item.value).key;
    }

    return value;
  }

  /**
   * Extends parent method
   */
  update_element() {
    super.update_element();

    for (const prop_name in this.#properties) {
      const module_prop = this.parent_model.module.properties[prop_name];
      const prop = this.#properties[prop_name];
      const prop_el = this.element.querySelector(`[name=${prop.id}]`);
      const control_el = document.getElementById(prop.id);
      if (null == control_el) return;

      // hide any errors
      prop.element.hide_error();

      // remove any properties that evaluate to hidden
      if (prop.is_hidden(this)) {
        prop_el.style.display = "none";
      } else {
        prop_el.style.removeProperty("display");
      }

      // disable any properties that evaluate to constant
      control_el.disabled = prop.is_constant(this);

      // now update the property element (this varies in the child base_add and base_view classes)
      this.update_property_element(prop.name);
    }
  }

  /**
   * Extends parent method
   */
  create_body_element() {
    const form_el = CN_element.create("<form></form>");
    const fieldset_el = CN_element.create("<fieldset></fieldset>");
    fieldset_el.disabled = !this.parent_model.allow_edit();
    form_el.append(fieldset_el);

    for (const prop_name in this.#properties) {
      fieldset_el.append(this.create_property_element(prop_name));
    }

    return form_el;
  }

  /**
   * Creates a property's element
   * @param string prop_name
   * @return Element
   */
  create_property_element(prop_name) {
    const module_prop = this.parent_model.module.properties[prop_name];
    const prop = this.properties[prop_name];
    const prop_el = CN_element.create(`<div name="${prop.id}" class="row mb-3"></div>`);

    // add the label to the property
    prop_el.append(CN_element.create_form_label({ for: prop.id, value: prop.title }));

    if (!prop.element) {
      // determine the property's UI element based on the type
      let params = CN_common.clone(prop);
      params.required = module_prop ? module_prop.required : false;
      params.placeholder = "(empty)";

      if ("typeahead" == prop.type) {
        params.typeahead = { ...prop.typeahead };
      } else if (["integer", "float"].includes(prop.type)) {
        params.min = prop.min;
        params.max = prop.max;
      } else {
        if (prop.format) params.format = prop.format;
        if (prop.regex) params.regex = prop.regex;
      }

      if (module_prop && module_prop.max_length) {
        params.max_length = module_prop.max_length;
      }

      if (!CN_common.is_function(params.onchange)) {
        params.onchange = async (control_el, success) => {
          if (success) {
            await this.on_set_property(prop.name);
          } else if ("view" == this.type) {
            this.undo_state(prop.name);
          }
        };
      }

      prop.element = CN_element.create_form_element(prop.type, params);
      prop.element.parent_model = this;
    }

    // wait for each control element to be added to the DOM then bind it to the state
    const observer = new MutationObserver((mutation, observer) => {
      mutation.filter(m => "childList" == m.type).forEach(m => {
        const control_el = document.getElementById(m.target.getAttribute("name"));
        control_el.addEventListener("input", () => this.set_state(control_el.name, control_el.value));
      });
      observer.disconnect();
    });
    observer.observe(prop_el, { childList: true });

    // add the value UI element to the property
    prop_el.append(prop.element);

    return prop_el;
  }
}
