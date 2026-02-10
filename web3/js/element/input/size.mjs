import CN_common from "../../common.mjs"
import { CN_input_base_string } from "./base_string.mjs"

export class CN_input_size extends CN_input_base_string {
  /**
   * Extend parent method
   */
  set_value(value) {
    // convert the value to a filesize string
    super.set_value(CN_common.format_filesize(Number(value)));
  }
}
