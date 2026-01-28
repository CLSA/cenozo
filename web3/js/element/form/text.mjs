import { CN_base_input } from "./base_input.mjs"

export class CN_form_text extends CN_base_input {
  /**
   * Extends the parent method
   */
  _create_control_element() {
    return this.constructor.html(`
      <textarea
        class="form-control"
        oninput="
          this.style.height = '';
          this.style.height = this.scrollHeight + 'px';
        "
      ></textarea>
    `);
  }

  /**
   * Extends parent method
   */
  flash_border() {
    super.flash_border();

    // we also have to update text input heights since depending on the old_style doesn't seem to work
    const control_el = this.get_control_element();
    control_el.style.height = "";
    control_el.style.height = control_el.scrollHeight + "px";
  }

  /**
   * Convenience method to create and render the element (without needing access to the created object)
   * @param object params: The parameters sent to the class constructor
   * @return Element
   */
  static create(config) { return (new CN_form_text(config)).render(); }
}
