import CN_api from "./api.mjs"
import CN_common from "./common.mjs"
import CN_element from "./element.mjs"
import CN_session from "./session.mjs"

import { CN_base_record } from "./base_record.mjs"

export class CN_base_add extends CN_base_record {
  #default_values_applied = [];

  /**
   * Constructor
   *
   * @param base_model parent_model: The model that the action belongs to
   * @param object properties: A list of property definitions (see parent class for more details)
   */
  constructor(parent_model, properties) {
    super("add", parent_model, properties);
  }

  /**
   * Extends the parent method
   */
  async get_text(type) {
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

    return await super.get_text(type);
  }

  /**
   * Extends the parent method
   */
  async on_load() {
    await super.on_load();

    this.for_each_property(prop => {
      // add an extra rank to make room for adding a new record
      if ("rank" == prop.type) {
        const extra_rank = prop.enum.values.length + 1;
        prop.enum.values.push({ key: extra_rank, value: CN_common.ordinal_suffix(extra_rank) });
      }
    });
  }

  /**
   * Commits a property's UI value to the state
   * @param string prop_name
   */
  async on_set_property(prop_name) {
    this.get_property(prop_name).state.commit();
  }

  /**
   * Validates all properties and creates a new record on the server side
   */
  async on_submit() {
    // validate all property values
    let valid = true;
    let record = {};
    this.for_each_property(prop => {
      // set record value and validate all visible properties
      if (!prop.is_hidden(this)) {
        record[prop.name] = this.get_formatted_property(prop.name);
        if (!prop.element.validate()) valid = false;
      }
    });

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
          const prop = this.get_property(prop_name);
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
   * Update's a property's element, applying default values when first called
   * @param string prop_name
   */
  update_property_element(prop_name) {
    const prop = this.get_property(prop_name);
    const control_el = document.getElementById(prop.id);

    // set all default values once only
    if (this.#default_values_applied.includes(prop_name)) return;

    if (["boolean", "enum", "rank"].includes(prop.type)) {
      if ("boolean" == prop.type) {
        // set the boolean placeholder
        const empty_option_el = control_el.querySelector('option[value=""]');
        if (empty_option_el) empty_option_el.innerHTML = `(Select a ${prop.title}...)`;
      } else {
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

    this.#default_values_applied.push(prop_name);
  }

  /**
   * Extends parent method
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
