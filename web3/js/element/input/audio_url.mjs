import { CN_base_input } from "./base_input.mjs"

export class CN_input_audio_url extends CN_base_input {
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
}
