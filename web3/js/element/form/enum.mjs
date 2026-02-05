import CN_api from "../../api.mjs"
import CN_common from "../../common.mjs"
import { CN_base_input } from "./base_input.mjs"

const default_config = {
  enum: { values: [] },
};

export class CN_form_enum extends CN_base_input {
  constructor(config = {}) {
    if (!CN_common.is_object(config)) {
      throw new Error("Non-object config argument passed to CN_form_enum contructor");
    }

    // don't replace the enum property in the config if it's an object, merge it with the default instead
    if (CN_common.is_object(config.enum)) {
      config.enum = {...default_config.enum, ...config.enum};
    }

    super({...default_config, ...config});
  }

  /**
   * Extends the parent method
   */
  _create_control_element() {
    const el = this.constructor.html('<select class="form-select"></select>');
    this.update();
    return el;
  }

  /**
   * Extend parent method
   */
  async update() {
    const enum_obj = this.get_config("enum");

    // re-generate the option list
    if (CN_common.is_function(enum_obj.get_enums)) { // check if a get_enums function exists in the params
      enum_obj.values = await enum_obj.get_enums(this);
    } else if (enum_obj.path) { // check if a path property exists in the params (may be a string or a function)
      // build the params object for getting the enum values
      const get_params = {
        select: enum_obj.select ? enum_obj.select : { column: "name" },
        modifier: enum_obj.modifier ? enum_obj.modifier : { order: "name" },
      };

      // always add a limit to make sure that list isn't truncated
      if (!get_params.modifier.limit) get_params.modifier.limit = 1000;

      // the path may be dynamic
      let path = CN_common.is_function(enum_obj.path) ? await enum_obj.path(this) : enum_obj.path;

      // set the enum values
      const response = await CN_api.get(path, get_params);
      enum_obj.values = response.reduce((list, record) => {
        list.push({
          ...record,
          key: record.id,
          value: record.name,
          disabled: [true, "true", 1, "1"].includes(record.disabled),
        });
        return list;
      }, []);
    } else {
      // enum properties without an enum path use the column definition
      const module_prop = this.get_module().get_property(prop_name);
      const matches = module_prop ? module_prop.type.match(/^enum\('(.+)'\)$/) : null;
      if (null == matches) throw new Error(`Property ${prop_name} has no valid enum values.`);
      enum_obj.values = matches[1].split("','").map(v => ({ key: v, value: v, disabled: false }));
    }

    // now replace the options
    const control_el = this.get_control_element();
    control_el.innerHTML = "";

    // get the default value
    const required = this.get_config("required");
    const default_value = (
      this.has_config("get_default") ?
      this.get_config("get_default")(this.get_action() ? this.get_action().get_model() : null) :
      null
    );

    // add a placeholder option
    if (!required || null == default_value) {
      control_el.prepend(this.constructor.html(`
        <option value="">${
          this.has_config("placeholder") ?
          this.get_config("placeholder") : // use the placeholder in the config if one exists
          (required ? "(Select an option...)" : "(empty)")
        }</option>
      `));
    }

    const value = this.get_value();
    enum_obj.values.forEach(option => {
      const option_el = this.constructor.html(`<option value="${option.key}">${option.value}</option>`);
      if (option.disabled) option_el.setAttribute("disabled", true);

      // determine which option is selected
      if (
        ("" == option.key && null === value) ||
        (1 == option.key && true === value) ||
        (0 == option.key && false === value) ||
        (null != value && option.key === value)
      ) {
        option_el.selected = true;
      } else {
        option_el.removeAttribute("selected");
      }

      control_el.append(option_el);
    });
  }

  /**
   * Convenience method to create and render the element (without needing access to the created object)
   * @param object params: The parameters sent to the class constructor
   * @return Element
   */
  static create(config) { return (new CN_form_enum(config)).render(); }
}
