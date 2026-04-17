import { CN_api } from "../api.mjs"
import { CN_base_action } from "./base_action.mjs"
import { CN_common } from "../common.mjs"
import { CN_element_label } from "../element/label.mjs"
import { CN_input } from "../input/input.mjs"

export class CN_action_base_record extends CN_base_action {
  #property_groups;
  #form_el;

  /**
   * Constructor
   * @param string type: The type of action (either "add" or "view")
   * @param base_model model: The model that the action belongs to
   */
  constructor(type, parent_el, model) {
    super(type, parent_el, model);

    if ("CN_action_base_record" == this.constructor) {
      throw new Error("Abstract class CN_action_base_record can't be instantiated.");
    }

    // while setting up all property groups keep track of all property names to ensure they are unique
    let existing_properties = {};

    // setup all property group
    const properties = this.get_model().clone_properties();
    this.#property_groups = {};
    for (const key in properties) {
      const entry = properties[key];
      if (entry.hasOwnProperty("properties")) {
        // this is a group containing its own list of properties
        const group_name = key;
        this.add_property_group(group_name, entry);
        for (const prop_name in entry.properties) {
          this.add_property(group_name, prop_name, CN_common.clone(entry.properties[prop_name]));
        }
      } else {
        // this is a property belonging to the $main group
        const group_name = "$main";
        const prop_name = key;

        // setup the main group if it doesn't already exist
        if (!this.#property_groups.hasOwnProperty(group_name)) {
          this.add_property_group(group_name, { title: null });
        }

        this.add_property(group_name, prop_name, CN_common.clone(entry));
      }
    }
  }

  /**
   * Adds or replaces a property group to the model
   * @param string group_name: The name of the group
   * @param object group: The group's parameters including title and open (for non-main groups)
   */
  add_property_group(group_name, group) {
    this.#property_groups[group_name] = {
      title: group.hasOwnProperty("title") ? group.title : null,
      properties: {},
    };

    if ("$main" != group_name) {
      // non-main groups must have an open property and is_hidden function
      this.#property_groups[group_name].open = group.hasOwnProperty("open") ? Boolean(group.open) : false;
      this.#property_groups[group_name].is_hidden = (
        group.hasOwnProperty("is_hidden") ?
        group.is_hidden :
        () => false
      );
    }
  }

  /**
   * Adds a property to the model
   *
   * The prop object may contain any of the following sub-properties:
   *   title: a string that defines the property's label (should be written in "Title Case")
   *     (the default value is undefined)
   *   type: one of the input types found in the input/ directory
   *     (the default value is "string")
   *   help: text that will appear when hovering over the property's label
   *     (the default is undefined - no help text)
   *   format: restricts the property's value to a predefined format ("alphanum", "alpha_num" or "identifier")
   *     (the default is undefined - no format)
   *   regex: restricts the property's value to a regular expression as a string (or array of strings)
   *     (the default is undefined - no regex)
   *   on_change: an async function which is called when a property's value is changed, with arguments:
   *     form_input: the property's form input object (input classes)
   *     valid: whether or not the new value is valid
   *     (the default function is to call this class' on_property_change() method)
   *   is_constant: a function that makes the property read-only when it returns true, with arguments:
   *     model: the model of the action that the property belongs to
   *     (the default function always returns false)
   *   is_hidden: a function that hides the property when it returns true, with arguments:
   *     model: the model of the action that the property belongs to
   *     (the default function always returns false)
   *   meta: an object used to define the property's data definition when it doesn't exist in the parent module.
   *     The object can include column select properties as defined in CN_api.select().  If left as an empty
   *     object then the select's column property will be set to the prop's name.  Note that the alias property
   *     will be ignored as it is automatically set to the property's name.  Finally, if the object is set to
   *     a non-object value then the property will be left blank (not associated with any service column).
   *   properties: this is used when defining a sub-group of properties INSTEAD of a property
   *     (the default is undefined - this is not a sub-group)
   *
   * The following properties are only used for certain property types:
   *   Optional properties for the numeric types (integer, float):
   *   min: restricts the property's minimum value
   *     (the default is undefined - there is no minimum value)
   *   max: restricts the property's maximum value
   *     (the default is undefined - there is no maximum value)
   *
   *   Mandatory property for the "enum" type:
   *   enum: an object with one of three sets of properties:
   *     static list of enum values:
   *       values: an array containing all possible enum values (each having a key, value and disabled property)
   *     enum value retrieved from the server:
   *       path: the API path to get enum values
   *       select: a select property to be used when calling the API for enum values
   *       modifier: a modifier property to be used when calling the API for enum values
   *     enum values returned by a user-defined function:
   *       get_enums: an async function that returns enum values, with arguments:
   *         model: the model of the action that the property belongs to
   *
   *   Mandatory property for the "typeahead" type:
   *   typeahead: an object with one of the two sets of properties:
   *     pre-defined typeahead values:
   *       list: an array of all possible typeahead values
   *     typeahead values returned by a user-defined function:
   *       get_list: an async function that returns the typeahead values, with arguments:
   *         value: the search value provided by the user
   *         form_input: the property's form_input object
   *       Note that this function is often provided by a get_typeahead() function in the related model
   *
   *   Mandatory property for the "file" type:
   *   file: an object with the following properties:
   *     encoding: how the file is encoded ("base64", "text", etc)
   *     mime_type: the file's mime-type ("application/pdf", "text/csv", etc)
   *     get_filename: an async function that returns the file's name, with arguments:
   *       action: the action object that the property belongs to
   *
   * @param string group_name: The name of the group to add the property to (null for the main group)
   * @param string prop_name: The name of the property
   * @param object prop: The property's parameters
   */
  add_property(group_name, prop_name, prop) {
    // make sure the property doesn't already exist
    if (null != this.get_property(prop_name)) {
      throw new Error(
        `Tried to add duplicate property "${prop_name}" to the "${this.get_model().get_name()}" model.`
      );
    }

    const module = this.get_model().get_module();
    prop.id = [this.get_model().get_unique_id(), prop_name].join("-");
    prop.name = prop_name;
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

    if (["integer", "float"].includes(prop.type)) {
      // numerical properties may have min/max values
      prop.min = prop.hasOwnProperty("min") ? prop.min : (prop.type.match(/unsigned/) ? 0 : null);
      prop.max = prop.hasOwnProperty("max") ? prop.max : null;
    }

    // make sure all properties have the is_constant, is_hidden and get_default functions
    if (!CN_common.is_function(prop.is_constant)) prop.is_constant = () => false;
    if (!CN_common.is_function(prop.is_hidden)) {
      prop.is_hidden = (model) => {
        const parent_model = model.get_parent_model();
        return parent_model && prop.name == `^${parent_model.get_name()}_id$`;
      };
    }
    if (!CN_common.is_function(prop.get_default)) {
      // if the column is a reference to the parent then use the parent's id
      prop.get_default = (model) => {
        const module_prop = module.get_property(prop_name);
        const parent_model = model.get_parent_model();
        return (
          parent_model && prop.name == `${parent_model.get_name()}_id` ?
          parent_model.get_identifier() :
          (module_prop ? module_prop.default : null)
        );
      };
    }

    // now create the form_input associated with this property
    this.create_property_form_input(prop);

    // finally, add the property to the appropriate group ($main being the default group)
    this.#property_groups[!group_name ? "$main" : group_name].properties[prop_name] = prop;
  }

  /**
   * Convenience method to gets a property by name (no matter which group it belongs to)
   * @param string prop_name: The name of the property
   * @return object
   */
  get_property(prop_name) {
    for (const group_name in this.#property_groups) {
      if (this.#property_groups[group_name].properties.hasOwnProperty(prop_name)) {
        return this.#property_groups[group_name].properties[prop_name];
      }
    }
    return null;
  }

  /**
   * Runs an array of all properties
   */
  get_all_properties() {
    const properties = [];
    for (const group_name in this.#property_groups) {
      for (const prop_name in this.#property_groups[group_name].properties) {
        properties.push(this.#property_groups[group_name].properties[prop_name]);
      }
    }
    return properties;
  }

  /**
   * ADD DOCS
   */
  get_property_value(prop_name) {
    const prop = this.get_property(prop_name);
    return !prop || !prop.form_input ? undefined : prop.form_input.get_value();
  }

  /**
   * Returns a property's value formatted by its type for writing to a database record
   * @param string prop_name: The name of the property
   * @return (dynamic)
   */
  async get_property_value_for_record(prop_name) {
    const prop = this.get_property(prop_name);
    return !prop || !prop.form_input ? undefined : await prop.form_input.get_value_for_record();
  }

  /**
   * ADD DOCS
   */
  set_property_value(prop_name, value) {
    const prop = this.get_property(prop_name);
    if (prop && prop.form_input) prop.form_input.set_value(value);
  }

  /**
   * Creates a property's form input
   * @param {}: prop
   */
  create_property_form_input(prop) {
    if (!prop.form_input) {
      // determine the property's UI element based on the type
      const module_prop = this.get_model().get_module().get_property(prop.name);
      const input_config = CN_common.clone(prop);
      delete input_config.type;
      if (undefined === input_config.required) input_config.required = module_prop ? module_prop.required : false;
      if (undefined === input_config.max_length && module_prop && module_prop.max_length) {
        input_config.max_length = module_prop.max_length;
      }

      // if the prop doesn't have a custom on_change() function then implement the default behaviour
      if (!CN_common.is_function(input_config.on_change)) {
        input_config.on_change = async (form_input, valid) => await this.on_property_change(prop.name, valid);
      }

      input_config.action = this;
      input_config.class = "col-sm-9";
      input_config.undo = true;

      // make errors in the view action go away after 4 seconds
      input_config.error_timeout = "view" == this.get_type() ? 4000 : 0;

      if (CN_common.is_datetime_type(prop.type, "date")) {
        // convert min/max values to get_min() and get_max() functions
        if (input_config.min) {
          if (["now", "today"].includes(input_config.min)) {
            input_config.get_min = () => new Date();
          } else if (
            CN_common.is_string(input_config.min) &&
            this.get_all_properties().some(prop => prop.name == input_config.min)
          ) {
            // if the min value is the name of an input then use the input's value as the min
            input_config.get_min = () => {
              const min_prop = this.get_property(input_config.min);
              return (
                CN_common.is_datetime_type(min_prop.type, "date") ?
                min_prop.form_input.get_date() :
                this.get_property_value(input_config.min)
              );
            };
          }
        }

        if (input_config.max) {
          if (["now", "today"].includes(input_config.max)) {
            input_config.get_max = () => new Date();
          } else if (
            CN_common.is_string(input_config.max) &&
            this.get_all_properties().find(prop => prop.name == input_config.max)
          ) {
            // if the max value is the name of an input then use the input's value as the max
            input_config.get_max = () => {
              const max_prop = this.get_property(input_config.max);
              return (
                CN_common.is_datetime_type(max_prop.type, "date") ?
                max_prop.form_input.get_date() :
                this.get_property_value(input_config.max)
              );
            };
          }
        }
      } else if ("rank" == prop.type) {
        // define the max rank
        input_config.max_rank = async () => {
          const model = this.get_model();
          const response = await CN_api.get(model.get_base_path("api"), {
            select: { column: {
              column: `max(${model.get_name()}.rank)`,
              alias: "max_rank",
              table_prefix: false
            } },
          });
          return (
            Number(null == response[0].max_rank ? 0 : response[0].max_rank) +
            // if this is the add action then add an additional rank
            ("add" == this.get_type() ? 1 : 0)
          );
        };
      }
      prop.form_input = CN_input.create_input(prop.type, null, input_config);
      prop.form_input.add_event_listener("undovalue", (input, data) => {
        // only update the property if we're undoing from a committed value to a committed value
        if (data.was_committed && data.is_committed) this.on_set_property(prop.name);
      });
    }
  }

  /**
   * Sets whether to disable the action's UI elements
   * @param boolean disabled
   */
  set_disabled(disabled) {
    super.set_disabled(disabled);

    // disable all form inputs by setting the fieldset's disable state
    const fieldset_el = this.get_body_element().querySelector('fieldset');
    if (fieldset_el) {
      this.constructor.set_disabled(
        fieldset_el,
        this.get_disabled() || ("view" == this.get_type() && !this.get_model().allow_edit())
      );
    }
  }

  /**
   * Extends parent method
   */
  update_element() {
    super.update_element();

    // update whether the record can be edited
    const fieldset_el = this.get_body_element().querySelector('fieldset');
    if (fieldset_el) {
      this.constructor.set_disabled(
        fieldset_el,
        this.get_disabled() || ("view" == this.get_type() && !this.get_model().allow_edit())
      );
    }

    for (const group_name in this.#property_groups) {
      const group = this.#property_groups[group_name];
      if ("$main" != group_name) {
        const group_el = this.get_element().querySelector(`.accordion-item[name=${group_name}]`);
        if (group_el) {
          if (group.is_hidden(this.get_model())) {
            group_el.classList.add("d-none");
          } else {
            group_el.classList.remove("d-none");
          }
        }
      }
      for (const prop_name in group.properties) {
        const prop = group.properties[prop_name];
        const prop_el = this.get_element().querySelector(`[name=${prop.id}]`);
        if (prop_el) {
          // remove any properties that evaluate to hidden
          if (prop.is_hidden(this.get_model())) {
            prop_el.classList.add("d-none");
          } else {
            prop_el.classList.remove("d-none");
          }

          // disable any properties that evaluate to constant
          prop.form_input.set_disabled(prop.is_constant(this.get_model()));

          // now update the property element (this varies in the child action_add and action_view classes)
          this.update_property_element(prop.name);
        }
      }
    }
  }

  /**
   * Extends parent method
   */
  create_body_element() {
    const form_el = this.constructor.html("<form><fieldset></fieldset></form>");

    // create the main group above all others
    if (this.#property_groups.hasOwnProperty("$main")) {
      const parent_el = this.constructor.html('<div class="px-3"></div>');
      form_el.querySelector("fieldset").append(parent_el);
      for (const prop_name in this.#property_groups.$main.properties) {
        const prop = this.#property_groups.$main.properties[prop_name];
        this.create_property_element(prop);
        parent_el.append(prop.element);
      }
    }

    // now create all other groups
    let accordion_el = null;

    for (const group_name in this.#property_groups) {
      if ("$main" != group_name) {
        if (null == accordion_el) {
          accordion_el = this.constructor.html(`<div class="accordion accordion-flush"></div>`);
        }

        const group_el = this.create_property_group_element(group_name);
        accordion_el.append(group_el);
        const group_body_el = group_el.querySelector("div.accordion-body");
        for (const prop_name in this.#property_groups[group_name].properties) {
          const prop = this.#property_groups[group_name].properties[prop_name];
          this.create_property_element(prop);
          group_body_el.append(prop.element);
        }
      }
    }

    if (null != accordion_el) form_el.querySelector("fieldset").append(accordion_el);

    return form_el;
  }

  /**
   * Extends parent method
   */
  create_placeholder_element() {
    const prop_list = Array.from(Array(7).keys()).map(() => `
      <div class="row mb-3">
        <label class="col-sm-3 col-form-label text-end placeholder-glow">
          <span class="placeholder placeholder-lg col-${Math.ceil(Math.random()*6)+6}"></span>
        </label>
        <div class="col-sm-9 placeholder-glow h-100">
          <input class="form-control placeholder disabled" disabled></input>
        </div>
      </div>
    `);

    return this.constructor.html(`<div>${prop_list.join("")}</div>`);
  }

  /**
   * Creates a property group's element
   * @param string group_name
   * @return Element
   */
  create_property_group_element(group_name) {
    const group = this.#property_groups[group_name];
    const group_id = [this.get_model().get_unique_id(), group_name].join("-");

    // we use <a> instead of <button> so that the the accordion can still be expanded when the action is disabled
    return this.constructor.html(`
      <div name="${group_name}" class="accordion-item px-0">
        <div class="accordion-header">
          <a
            href="#"
            class="
              accordion-button
              link-underline
              link-underline-opacity-0
              ${group.open ? "" : "collapsed"}
              fw-bold py-2
            "
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#${group_id}"
            aria-expanded="${group.open ? "true" : "false"}"
            aria-controls="${group_id}"
          >${group.title}</a>
        </div>
        <div id="${group_id}" class="accordion-collapse collapse ${group.open ? "show" : ""}">
          <div class="accordion-body"></div>
        </div>
      </div>
    `);
  }

  /**
   * Creates a property's element, storing it in the prop parameter as a new "element" property
   * @param {}: prop
   */
  create_property_element(prop) {
    prop.element = this.constructor.html(`<div name="${prop.id}" class="row mb-3"></div>`);

    // add the label to the property
    CN_element_label.append(prop.element, {
      for: prop.id,
      value: prop.title,
      help: prop.help,
      class: "col-sm-3"
    });

    prop.form_input.set_parent_element(prop.element);
    prop.element.append(prop.form_input.get_element());
  }

  /**
   * Extends parent method
   */
  _create_element() {
    // remove the card body's padding to make better use of space
    const el = super._create_element();
    el.querySelector(
      this.get_simple_mode() ?
      ":scope > div" :
      ":scope > div > div.card > .card-body"
    ).classList.add("pb-0", "px-0");
    return el;
  }

  /**
   * ADD DOCS
   */
  async on_property_change(prop_name, valid) {
    if (valid) {
      await this.on_set_property(prop_name);
    } else if ("view" == this.get_type()) {
      this.get_property(prop_name).form_input.undo_value(false);
    }
  }

  /**
   * Extend parent method
   */
  async on_dom_add() {
    super.on_dom_add();
  }

  /**
   * Extend parent method
   */
  async on_dom_remove() {
    // remove all inputs before removing from the DOM
    this.get_all_properties().forEach(prop => {
      if (prop.element) prop.element.innerHTML = "";
    });

    super.on_dom_remove();
  }
}
