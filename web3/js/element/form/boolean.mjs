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

    if (!this.get_config("required")) {
      let empty = !this.has_config("placeholder") ? "(empty)" : this.get_config("placeholder");
      el.prepend(this.constructor.html(`<option value="">${empty}</option>`));
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
   * Convenience method to create and render the element (without needing access to the created object)
   * @param object params: The parameters sent to the class constructor
   * @return Element
   */
  static create(config) { return (new CN_form_boolean(config)).render(); }
}
