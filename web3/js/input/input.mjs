import { CN_base_object } from "../base_object.mjs"
import { CN_input_audio_url } from "./audio_url.mjs"
import { CN_input_boolean } from "./boolean.mjs"
import { CN_input_color } from "./color.mjs"
import { CN_input_date } from "./date.mjs"
import { CN_input_datetime } from "./datetime.mjs"
import { CN_input_datetimesecond } from "./datetimesecond.mjs"
import { CN_input_dob } from "./dob.mjs"
import { CN_input_dod } from "./dod.mjs"
import { CN_input_email } from "./email.mjs"
import { CN_input_enum } from "./enum.mjs"
import { CN_input_file } from "./file.mjs"
import { CN_input_float } from "./float.mjs"
import { CN_input_integer } from "./integer.mjs"
import { CN_input_password } from "./password.mjs"
import { CN_input_rank } from "./rank.mjs"
import { CN_input_size } from "./size.mjs"
import { CN_input_string } from "./string.mjs"
import { CN_input_text } from "./text.mjs"
import { CN_input_time } from "./time.mjs"
import { CN_input_typeahead } from "./typeahead.mjs"

export class CN_input extends CN_base_object {
  constructor () {
    throw new Error("Abstract class CN_input can't be instantiated, use static create_input() method instead.");
  }

  /**
   * ADD DOCS
   */
  static create_input(type, parent_el, config) {
    if ("audio_url" == type) return new CN_input_audio_url(parent_el, config);
    if ("boolean" == type) return new CN_input_boolean(parent_el, config);
    if ("color" == type) return new CN_input_color(parent_el, config);
    if ("date" == type) return new CN_input_date(parent_el, config);
    if ("datetime" == type) return new CN_input_datetime(parent_el, config);
    if ("datetimesecond" == type) return new CN_input_datetimesecond(parent_el, config);
    if ("dob" == type) return new CN_input_dob(parent_el, config);
    if ("dod" == type) return new CN_input_dod(parent_el, config);
    if ("email" == type) return new CN_input_email(parent_el, config);
    if ("enum" == type) return new CN_input_enum(parent_el, config);
    if ("file" == type) return new CN_input_file(parent_el, config);
    if ("float" == type) return new CN_input_float(parent_el, config);
    if ("integer" == type) return new CN_input_integer(parent_el, config);
    if ("password" == type) return new CN_input_password(parent_el, config);
    if ("rank" == type) return new CN_input_rank(parent_el, config);
    if ("size" == type) return new CN_input_size(parent_el, config);
    if ("string" == type) return new CN_input_string(parent_el, config);
    if ("text" == type) return new CN_input_text(parent_el, config);
    if ("time" == type) return new CN_input_time(parent_el, config);
    if ("typeahead" == type) return new CN_input_typeahead(parent_el, config);

    throw new Error(`Tried to create invalid input type "${type}"`);
  }
}
