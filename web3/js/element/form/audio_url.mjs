import { CN_base_input } from "./base_input.mjs"

export class CN_form_audio_url extends CN_base_input {
  /**
   * Extends the parent method
   */
  _create_control_element() {
    return this.constructor.html('<audio controls="" class="w-100"></audio>');
  }

  /**
   * Replace the parent method
   */
  validate() {
    // no validation required
    return true;
  }

  /**
   * Convenience method to create and render the element (without needing access to the created object)
   * @param object params: The parameters sent to the class constructor
   * @return Element
   */
  static create(config) { return (new CN_form_audio_url(config)).render(); }
}
