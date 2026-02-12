import CN_api from "../../api.mjs"
import CN_common from "../../common.mjs"
import { CN_base_input } from "./base_input.mjs"

export class CN_input_enum extends CN_base_input {
  constructor(config = {}) {
    if (!CN_common.is_object(config)) {
      throw new Error("Non-object config argument passed to CN_input_enum contructor");
    }

    // make sure the enum config object has a values array
    if (CN_common.is_object(config.enum) && !CN_common.is_array(config.enum.values)) {
      config.enum.values = [];
    }

    super({
      ...{
        // default config
        enum: { values: [] }
      },
      ...config}
    );
  }

  /**
   * Extends the parent method
   */
  _create_control_element() {
    return this.constructor.html('<select class="form-select"></select>');
  }

  /**
   * Extend parent method
   */
  set_value(value) {
    super.set_value(value);

    const el = this.get_control_element();
    this.get_config("enum").values.forEach(option => {
      const option_el = el.querySelector(`option[value="${option.key}"]`);
      if (value == option.key) {
        option_el.selected = true;
      } else {
        option_el.removeAttribute("selected");
      }
    });
  }

  /**
   * Extend parent method
   */
  async update() {
    const control_el = this.get_control_element();
    const enum_obj = this.get_config("enum");

    // re-generate the option list
    let new_values = true;
    if (CN_common.is_function(enum_obj.get_enums)) {
      // check if a get_enums function exists in the params
      enum_obj.values = await enum_obj.get_enums(this);
    } else if (enum_obj.path) {
      // check if a path property exists in the params (may be a string or a function)
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
      // check for enums in the column definition (for inputs linked to an action only)
      const action = this.get_action();
      if (action) {
        const module_prop = action.get_model().get_module().get_property(control_el.getAttribute("name"));
        const matches = module_prop ? module_prop.type.match(/^enum\('(.+)'\)$/) : null;
        if (null != matches) {
          enum_obj.values = matches[1].split("','").map(v => ({ key: v, value: v, disabled: false }));
        } else {
          new_values = false;
        }
      }
    }

    if (
      new_values ||
      (0 == enum_obj.values.length && 0 < control_el.innerHTML.length) ||
      (0 < enum_obj.values.length && 0 == control_el.innerHTML.length)
    ) {
      // now replace the options
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
  }
}
