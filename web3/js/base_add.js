import CN_api from "./api.js"
import CN_common from "./common.js"
import CN_element from "./element.js"
import CN_session from "./session.js"

import { CN_base_action } from "./base_action.js"

export class CN_base_add extends CN_base_action {
  #properties;

  // getters and setters
  get properties() { return this.#properties }

  /**
   * ADD DOCS
   */
  constructor(parent_model, properties) {
    super(parent_model);

    // setup each property
    const parent_module = this.parent_model.get_parent_module();
    this.#properties = CN_common.clone(properties);
    for (let prop_name in this.#properties) {
      const prop = this.#properties[prop_name];
      const module_prop = this.parent_model.module.properties[prop_name];
      prop.id = [this.parent_model.unique_id, prop_name].join("-");
      if (!prop.type) prop.type = "string";

      if ("typeahead" == prop.type) {
        if (!prop.typeahead) prop.typeahead = {};
        if (!prop.typeahead.min_length) prop.typeahead.min_length = 2;
        if (!prop.typeahead.list) prop.typeahead.list = [];
        if (!prop.typeahead.on_cancel) {
          prop.typeahead.on_cancel = (el) => {
            // go back to the last selected value
            el.value = el.last_selected_value;
          };
        }
        if (!prop.typeahead.on_select) {
          prop.typeahead.on_select = (el) => {
            // update the last selected value with the new selection
            el.last_selected_value = el.value;
          };
        }
      }

      if (["integer", "float"].includes(prop.type)) {
        prop.min = this.#properties.hasOwnProperty("min") ? this.#properties.min : null;
        prop.max = this.#properties.hasOwnProperty("max") ? this.#properties.max : null;
      }

      if (!CN_common.is_function(prop.is_constant)) prop.is_constant = () => false;
      if (!CN_common.is_function(prop.is_hidden)) {
        prop.is_hidden = () => parent_module && prop_name.match(`${parent_module.subject}_id`);
      }
      if (!CN_common.is_function(prop.get_default)) {
        // if the column is a reference to the parent then use the parent's id
        prop.get_default = () => (
          parent_module && prop_name.match(`${parent_module.subject}_id`) ?
          parent_module.model.actions.view.record.id :
          (module_prop ? module_prop.default : null)
        );
      }
    }
  }

  /**
   * ADD DOCS
   */
  get_text(type) {
    if ("header" == type) {
      let text = `Add ${CN_common.uc_words(this.parent_model.name.singular)}`;
      const parent_module = this.parent_model.get_parent_module();
      if (parent_module) {
        text += ` to ${CN_common.uc_words(parent_module.model.name.singular)}`;
      }
      return text;
    }

    if ("submit" == type) {
      return "Submit";
    }

    if ("cancel" == type) {
      return "Cancel";
    }

    return super.get_text(type);
  }

  /**
   * ADD DOCS
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
          // enum properties with an enum object use the column definition
          let matches = module_prop ? module_prop.type.match(/^enum\('(.+)'\)$/) : null;
          if (null == matches) {
            throw new Error(`Property ${prop_name} has no valid enum values.`);
          } else {
            prop.enum = { values: matches[1].split("','").map(v => ({ key: v, value: v })) };
          }
        }
      }
    }

    await Promise.all(promise_list);
  }

  /**
   * ADD DOCS
   */
  async on_submit() {
    // validate all property values
    let valid = true;
    let record = {};
    for (const prop_name in this.#properties) {
      const module_prop = this.parent_model.module.properties[prop_name];
      const prop = this.#properties[prop_name];
      const prop_el = this.element.querySelector(`[name=${prop.id}]`);
      const control_el = document.getElementById(prop.id);

      // don't include hidden properties
      if (prop.is_hidden(this)) continue;

      if ("enum" == prop.type) {
        record[prop_name] = (
          "" === control_el.options[control_el.selectedIndex].value ?
          null :
          control_el.options[control_el.selectedIndex].value
        );
      } else if ("typeahead" == prop.type) {
        // convert from label to value by looking up the element's typeahead list in the params object
        // NOTE: this is not the same as the property's params object (it is copied when the element is created)
        record[prop_name] = prop.element.params.typeahead.list.find(item => control_el.value === item.label).value;
      } else {
        record[prop_name] = control_el.value;
      }

      // make sure required properties are available
      if (module_prop && module_prop.required && "" === control_el.value) {
        prop.element.show_error("Can't be empty", 0);
        valid = false;
      }
    }

    if (!valid) return;

    try {
      // post the new record
      const response = await CN_api.post(this.parent_model.get_base_path("api"), record);

      // now view the new record
      const id = await response.text();
      await CN_session.navigate_to(
        this.parent_model.allow_view() ?
        this.parent_model.get_view_url(id) :
        this.parent_model.get_parent_module().model.get_view_url()
      );
    } catch (error) {
      if ("Conflict (409)" == error.name) {
        JSON.parse(error.body).forEach(prop_name => {
          const prop = this.#properties[prop_name];
          const prop_el = this.element.querySelector(`[name=${prop.id}]`);
          const control_el = document.getElementById(prop.id);
          prop.element.show_error("Conflicts with existing record", 0);
        });
      } else {
        throw error;
      }
    }
  }

  /**
   * ADD DOCS
   */
  update_element() {
    super.update_element();

    for (const prop_name in this.#properties) {
      const prop = this.#properties[prop_name];
      const prop_el = this.element.querySelector(`[name=${prop.id}]`);
      const control_el = document.getElementById(prop.id);

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

      // set all default values
      if (["boolean", "enum"].includes(prop.type)) {
        if ("boolean" == prop.type) {
          // set the boolean placeholder
          const empty_option_el = control_el.querySelector('option[value=""]');
          if (empty_option_el) empty_option_el.innerHTML = `(Select a ${prop.title}...)`;
        } else if ("enum" == prop.type) {
          // rebuild the enum select options
          control_el.innerHTML = (
            `<option value="">(Select a ${prop.title}...)</option>`
          );
          prop.enum.values.forEach(option => {
            control_el.append(CN_element.create(`
              <option value="${option.key}">${option.value}</option>
            `));
          });
        }

        control_el.querySelectorAll("option").forEach(option_el => {
          let default_value = prop.get_default(this);
          default_value = null == default_value ? "" : default_value.toString();
          if (option_el.value === default_value) {
            option_el.selected = true;
          } else {
            option_el.removeAttribute("selected");
          }
        });
      } else {
        let default_value = prop.get_default(this);
        if (undefined !== default_value) control_el.value = default_value;
        if ("typeahead" == prop.type) control_el.last_selected_value = control_el.value;
      }
    }
  }

  /**
   * ADD DOCS
   */
  create_property_element(prop_name) {
    const module_prop = this.parent_model.module.properties[prop_name];
    const prop = this.#properties[prop_name];
    const prop_el = CN_element.create(`<div name="${prop.id}" class="row mb-3"></div>`);

    // add the label to the property
    prop_el.append(CN_element.create_form_label({ for: prop.id, value: prop.title }));

    if (!prop.element) {
      // determine the property's UI element based on the type
      let params = {
        id: prop.id,
        name: prop_name,
        title: prop.title,
        required: module_prop ? module_prop.required : false,
      };

      // if this is a typeahead then create a copy of the typeahead object
      if ("typeahead" == prop.type) {
        params.typeahead = { ...prop.typeahead };
      } else {
        params.onchange = async (control_el, success) => {
          if (!success) {
            control_el.value = "";
          }
        };
      }

      if (["integer", "float"].includes(prop.type)) {
        params.min = prop.min;
        params.max = prop.max;
      }

      if (module_prop && module_prop.max_length) {
        params.max_length = module_prop.max_length;
      }

      prop.element = CN_element.create_form_element(prop.type, params);
    }

    // add the value UI element to the property
    prop_el.append(prop.element);

    return prop_el;
  }

  /**
   * ADD DOCS
   */
  create_body_element() {
    const form_el = CN_element.create("<form></form>");
    const fieldset_el = CN_element.create("<fieldset></fieldset>");
    form_el.append(fieldset_el);

    for (const prop_name in this.#properties) {
      fieldset_el.append(this.create_property_element(prop_name));
    }

    return form_el;
  }

  /**
   * ADD DOCS
   */
  create_footer_element() {
    const btn_group_el = CN_element.create('<div class="btn-group" role="group"></div>');

    const submit_btn_el = CN_element.create(
      '<button name="submit" type="button" class="btn btn-primary">Submit</button>'
    );
    btn_group_el.append(submit_btn_el);
    (async () => { submit_btn_el.innerHTML = await this.get_text("submit"); })();
    submit_btn_el.onclick = async () => await this.on_submit();

    const cancel_btn_el = CN_element.create(
      '<button name="cancel" type="button" class="btn btn-light">Cancel</button>'
    );
    btn_group_el.append(cancel_btn_el);
    (async () => { cancel_btn_el.innerHTML = await this.get_text("cancel"); })();
    cancel_btn_el.onclick = async () => await this.on_navigate_to_parent();

    return btn_group_el;
  }
}
