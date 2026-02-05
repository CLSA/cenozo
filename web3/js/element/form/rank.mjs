import CN_common from "../../common.mjs"
import { CN_form_enum } from "./enum.mjs"

export class CN_form_rank extends CN_form_enum {
  /**
   * Convenience method to create and render the element (without needing access to the created object)
   * @param object params: The parameters sent to the class constructor
   * @return Element
   */
  static create(config) { return (new CN_form_rank(config)).render(); }
}
