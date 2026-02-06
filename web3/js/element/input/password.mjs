import { CN_input_base_string } from "./base_string.mjs"

export class CN_input_password extends CN_input_base_string {
  /**
   * Convenience method to create and render the element (without needing access to the created object)
   * @param object params: The parameters sent to the class constructor
   * @return Element
   */
  static create(config) { return (new CN_input_password(config)).render(); }
}
