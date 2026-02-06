import { CN_input_base_datetime } from "./base_datetime.mjs"

export class CN_input_timesecond extends CN_input_base_datetime {
  /**
   * Convenience method to create and render the element (without needing access to the created object)
   * @param object params: The parameters sent to the class constructor
   * @return Element
   */
  static create(config) { return (new CN_input_timesecond(config)).render(); }
}
