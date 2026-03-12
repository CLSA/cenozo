import { CN_base_input } from "./base_input.mjs"

export class CN_input_audio_url extends CN_base_input {
  /**
   * Extends the parent method
   */
  _create_control_element() {
    return this.constructor.html('<audio controls="" class="form-control w-100 p-0"></audio>');
  }

  /**
   * Replace the parent method
   */
  validate() {
    // no validation required
    return true;
  }

  /**
   * Convenience method to create and add to a parent element (without needing access to the created object)
   * @param object params: The parameters sent to the class constructor
   * @return Element
   */
  static create_element(parent_el = null, config = {}) {
    const el = new CN_input_audio_url(parent_el, config).get_element();
    if (parent_el) parent_el.append(el);
    return el;
  }
}
