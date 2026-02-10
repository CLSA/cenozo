import { CN_base_input } from "./base_input.mjs"

export class CN_input_text extends CN_base_input {
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
   * Extend parent method
   */
  set_value(value) {
    super.set_value(value);
    this.#update_textarea_height();
  }

  /**
   * Replace parent method
   */
  flash_border() {
    const control_el = this.get_control_element();
    const old_style = control_el.style;
    control_el.style["border-color"] = "green";
    setTimeout(() => {
      control_el.style = old_style;
      this.#update_textarea_height();
    }, 500);
  }

  /**
   * Resizes the control element's textarea based on its current scroll height
   */
  #update_textarea_height() {
    const control_el = this.get_control_element();
    control_el.style.height = "";
    control_el.style.height = control_el.scrollHeight + "px";
  }
}
