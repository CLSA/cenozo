import { CN_base_input } from "./base_input.mjs"

export class CN_form_boolean extends CN_base_input {
  /**
   * Extends the parent method
   */
  _create_control_element() {
    const el = this.constructor.html(`
      <select class="form-select">
        <option value="1">Yes</option>
        <option value="0">No</option>
      </select>
    `);

    // get the default value
    let default_value = (
      this.has_config("get_default") ?
      this.get_config("get_default")(this.get_action() ? this.get_action().get_model() : null) :
      null
    );

    // add a placeholder option
    if (!this.get_config("required") || null == default_value) {
      el.prepend(this.constructor.html(`
        <option value="">${
          this.has_config("placeholder") ?
          this.get_config("placeholder") : // use the placeholder in the config if one exists
          null == default_value ?
          "(Select an option...)" : // prompt for a value if mandatory
          "(empty)" // show as empty if not mandatory
        }</option>
      `));
    }

    return el;
  }

  /**
   * Extends parent method
   */
  get_formatted_value() {
    const value = this.get_value();
    return "" == value ? null : Number(value);
  }

  /**
   * Extend parent method
   */
  set_value(value) {
    super.set_value(value);

    this.get_control_element().querySelectorAll("option").forEach(option_el => {
      if (
        ("" == option_el.value && null === value) ||
        (1 == option_el.value && true === value) ||
        (0 == option_el.value && false === value) ||
        (null != value && option_el.value === value.toString())
      ) {
        option_el.selected = true;
      } else {
        option_el.removeAttribute("selected");
      }
    });
  }

  /**
   * Convenience method to create and render the element (without needing access to the created object)
   * @param object params: The parameters sent to the class constructor
   * @return Element
   */
  static create(config) { return (new CN_form_boolean(config)).render(); }
}
