import CN_api from "./api.mjs"
import CN_common from "./common.mjs"
import CN_element from "./element.mjs"
import CN_session from "./session.mjs"

import { CN_base_action } from "./base_action.mjs"
import { CN_state } from "./state.mjs"

export class CN_base_record extends CN_base_action {
  #property_groups;
  #form_el;

  /**
   * Constructor
   *
   * TODO: document a full description of the properties parameter
   *
   * @param string type: The type of action (either "add" or "view")
   * @param base_model model: The model that the action belongs to
   */
  constructor(type, model) {
    super(type, model);

    // while setting up all property groups keep track of all property names to ensure they are unique
    let existing_properties = {};

    // setup all property group
    const properties = this.get_model().clone_properties();
    this.#property_groups = {};
    for (var key in properties) {
      let entry = properties[key];
      if (entry.hasOwnProperty("properties")) {
        const group_name = key;

        // make sure none of the properties in this group already exist
        for (var prop_name in entry.properties) {
          if (existing_properties.hasOwnProperty(prop_name)) {
            throw new Error(
              `The "${this.get_model().get_name()}" model contains a duplicate propery name "${prop_name}" ` +
              `that already exists in the "${existing_properties[prop_name]}" group.`
            );
          }
          existing_properties[prop_name] = group_name;
        }

        this.#property_groups[group_name] = CN_common.clone(entry);
        if (!this.#property_groups[group_name].hasOwnProperty("title")) {
          this.#property_groups[group_name].title = null;
        }
      } else {
        // put ungrouped properties in the base group
        const group_name = "$main";
        const prop_name = key;

        // setup the main group if it doesn't already exist
        if (!this.#property_groups.hasOwnProperty(group_name)) {
          this.#property_groups[group_name] = { title: null, properties: {} };
        }

        // make sure the property doesn't already exist
        if (existing_properties.hasOwnProperty(prop_name)) {
          throw new Error(
            `Duplicate propery name "${prop_name}" already exists in the ` +
            `"${existing_properties[prop_name]}" group`
          );
        }

        existing_properties[prop_name] = "main";
        this.#property_groups[group_name].properties[prop_name] = CN_common.clone(entry);
      }
    }

    // setup properties in each group
    const module = this.get_model().get_module();
    const parent_model = this.get_model().get_parent_model();
    for (var group_name in this.#property_groups) {
      for (var prop_name in this.#property_groups[group_name].properties) {
        const module_prop = module.get_property(prop_name);
        const prop = this.#property_groups[group_name].properties[prop_name];
        prop.id = [this.get_model().get_unique_id(), prop_name].join("-");
        prop.name = prop_name;
        prop.state = new CN_state();
        if (!prop.type) prop.type = "string";
        if (!prop.group) prop.group = null;

        // make sure all non meta columns properties exist in the module
        if (!prop.hasOwnProperty("meta")) {
          if (!module.has_property(prop.name)) {
            throw new Error(
              `Model property "${prop.name}" does not exist in "${this.get_model().get_name()}" module.`
            );
          }
        }

        // typeaheads need special configuration
        if ("typeahead" == prop.type) {
          if (!prop.typeahead) prop.typeahead = {};
          if (!prop.typeahead.list) prop.typeahead.list = [];
          if (!prop.typeahead.on_select) {
            prop.typeahead.on_select = item => {
              prop.state.set(item.value);
              prop.state.commit();
              if (CN_common.is_function(prop.element.params.onchange)) {
                prop.element.params.onchange(
                  document.getElementById(prop.id),
                  true,
                  prop.state.get()
                );
              }
            };
          }
          if (!prop.typeahead.on_cancel) {
            prop.typeahead.on_cancel = () => {
              prop.state.undo(true);
            }
          }
        } else if (["integer", "float"].includes(prop.type)) {
          // numerical properties may have min/max values
          prop.min = prop.hasOwnProperty("min") ? prop.min : (prop.type.match(/unsigned/) ? 0 : null);
          prop.max = prop.hasOwnProperty("max") ? prop.max : null;
        }

        // make sure all properties have the is_constant, is_hidden and get_default functions
        if (!CN_common.is_function(prop.is_constant)) prop.is_constant = () => false;
        if (!CN_common.is_function(prop.is_hidden)) {
          prop.is_hidden = (model) => {
            const parent_model = model.get_parent_model();
            return parent_model && prop.name.match(`${parent_model.get_name()}_id`);
          };
        }
        if (!CN_common.is_function(prop.get_default)) {
          // if the column is a reference to the parent then use the parent's id
          prop.get_default = (model) => {
            const parent_model = model.get_parent_model();
            return (
              parent_model && prop.name.match(`${parent_model.get_name()}_id`) ?
              parent_model.get_identifier() :
              (module_prop ? module_prop.default : null)
            );
          };
        }
      }
    }
  }

  /**
   * ADD DOCS
   */
  get_property(prop_name) {
    for (var group_name in this.#property_groups) {
      if (this.#property_groups[group_name].properties.hasOwnProperty(prop_name)) {
        return this.#property_groups[group_name].properties[prop_name];
      }
    }
    return null;
  }

  /**
   * ADD DOCS
   */
  for_each_property(callback) {
    for (var group_name in this.#property_groups) {
      for (var prop_name in this.#property_groups[group_name].properties) {
        callback(this.#property_groups[group_name].properties[prop_name]);
      }
    }
  }

  /**
   * Extends parent class
   */
  async on_load() {
    await super.on_load();

    // load dynamic enums
    const promise_list = [];
    for (var group_name in this.#property_groups) {
      for (var prop_name in this.#property_groups[group_name].properties) {
        const module_prop = this.get_model().get_module().get_property(prop_name);
        const prop = this.#property_groups[group_name].properties[prop_name];

        if ("enum" == prop.type) {
          if (CN_common.is_object(prop.enum) && prop.enum.path) {
            // populate the enum
            const params = {
              select: prop.enum.select ? prop.enum.select : { column: "name" },
              modifier: prop.enum.modifier ? prop.enum.modifier : { order: "name" },
            };

            // create an async function and add it to the promise list so they can be run in parallel
            const get_enums = async () => {
              // the path may be dynamic
              let path = (
                CN_common.is_function(prop.enum.path) ?
                await prop.enum.path(this.get_model()) :
                prop.enum.path
              );

              const response = await CN_api.get(path, params);
              prop.enum.values = (await response.json()).reduce((list, record) => {
                list.push({
                  ...record,
                  key: record.id,
                  value: record.name,
                  disabled: [true, "true", 1, "1"].includes(record.disabled),
                });
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
              column: `max(${this.get_model().get_name()}.rank)`,
              alias: "max_rank",
              table_prefix: false
            } },
          };

          const get_max_rank = async () => {
            const response = await CN_api.get(this.get_model().get_base_path("api"), params);
            let max_rank = (await response.json())[0].max_rank;
            if (null == max_rank) max_rank = 0;
            prop.enum = { values: [] };
            for(let r = 1; r <= max_rank; r++) {
              prop.enum.values.push({ key: r, value: CN_common.ordinal_suffix(r) });
            }
          };
          promise_list.push(get_max_rank());
        }
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
    const prop = this.get_property(prop_name);
    let value = prop.state.get();
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

    for (var group_name in this.#property_groups) {
      for (var prop_name in this.#property_groups[group_name].properties) {
        const prop = this.#property_groups[group_name].properties[prop_name];
        const prop_el = this.get_element().querySelector(`[name=${prop.id}]`);
        const control_el = document.getElementById(prop.id);
        if (null == control_el) return;

        // hide any errors
        prop.element.hide_error();

        // remove any properties that evaluate to hidden
        if (prop.is_hidden(this.get_model())) {
          prop_el.style.display = "none";
        } else {
          prop_el.style.removeProperty("display");
        }

        // disable any properties that evaluate to constant
        control_el.disabled = prop.is_constant(this.get_model());

        // now update the property element (this varies in the child base_add and base_view classes)
        this.update_property_element(prop.name);
      }
    }
  }

  /**
   * Extends parent method
   */
  create_body_element() {
    const form_el = CN_element.create("<form></form>");
    form_el.fieldset_el = CN_element.create("<fieldset></fieldset>");

    form_el.fieldset_el.disabled = "view" == this.get_type() && !this.get_model().allow_edit();
    form_el.append(form_el.fieldset_el);

    // create the main group above all others
    if (this.#property_groups.hasOwnProperty("$main")) {
      const parent_el = CN_element.create('<div class="px-3"></div>');
      form_el.fieldset_el.append(parent_el);
      for (var prop_name in this.#property_groups.$main.properties) {
        parent_el.append(this.create_property_element(prop_name));
      }
    }

    // now create all other groups
    let accordion_el = null;

    for (var group_name in this.#property_groups) {
      if ("$main" != group_name) {
        if (null == accordion_el) {
          accordion_el = CN_element.create('<div class="accordion accordion-flush"></div>');
        }

        const group_el = this.create_property_group_element(group_name);
        accordion_el.append(group_el);
        const group_body_el = group_el.querySelector("div.accordion-body");
        for (var prop_name in this.#property_groups[group_name].properties) {
          group_body_el.append(this.create_property_element(prop_name));
        }
      }
    }

    if (null != accordion_el) form_el.fieldset_el.append(accordion_el);

    return form_el;
  }

  /**
   * Extends parent method
   */
  create_placeholder_element() {
    const el_list = Array.from(Array(7).keys()).map((e,index) => `
      <div class="row mb-3">
        <label class="col-sm-3 col-form-label text-end placeholder-glow">
          <span class="placeholder placeholder-lg col-${Math.ceil(Math.random()*6)+6}"></span>
        </label>
        <div class="col-sm-9 placeholder-glow h-100">
          <input class="form-control placeholder" disabled></input>
        </div>
      </div>
    `);

    return CN_element.create(`<div class="px-3">${el_list.join("")}</div>`);
  }

  /**
   * Creates a property group's element
   * @param string group_name
   * @return Element
   */
  create_property_group_element(group_name) {
    const group = this.#property_groups[group_name];
    const group_id = [this.get_model().get_unique_id(), group_name].join("-");
    return CN_element.create(`
      <div class="accordion-item px-0">
        <div class="accordion-header">
          <button
            class="accordion-button collapsed fw-bold py-2"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#${group_id}"
            aria-expanded="false"
            aria-controls="${group_id}"
          >${group.title}</button>
        </div>
        <div id="${group_id}" class="accordion-collapse collapse">
          <div class="accordion-body">
          </div>
        </div>
      </div>
    `);
  }

  /**
   * Creates a property's element
   * @param string prop_name
   * @return Element
   */
  create_property_element(prop_name) {
    const module_prop = this.get_model().get_module().get_property(prop_name);
    const prop = this.get_property(prop_name);
    const prop_el = CN_element.create(`<div name="${prop.id}" class="row mb-3"></div>`);

    // add the label to the property
    prop_el.append(CN_element.create_form_label({ for: prop.id, value: prop.title, help: prop.help }));

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
          } else if ("view" == this.get_type()) {
            prop.state.undo();
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
        if (control_el) {
          const prop = this.get_property(control_el.name);
          prop.state.bind_element(control_el);
        }
      });
      observer.disconnect();
    });
    observer.observe(prop_el, { childList: true });

    // add the value UI element to the property
    prop_el.append(prop.element);

    return prop_el;
  }

  /**
   * Extends parent method
   */
  render() {
    // remove the card body's padding to make better use of space
    const el = super.render();
    el.querySelector(".card-body").classList.add("pb-0");
    el.querySelector(".card-body").classList.add("px-0");
    return el;
  }
}
