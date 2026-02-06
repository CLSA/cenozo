import CN_common from "../../common.mjs"
import { CN_input_enum } from "./enum.mjs"

export class CN_input_rank extends CN_input_enum {
  /**
   * Convenience method to create and render the element (without needing access to the created object)
   * @param object params: The parameters sent to the class constructor
   * @return Element
   */
  static create(config) { return (new CN_input_rank(config)).render(); }
}
