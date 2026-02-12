import { CN_base_object } from "../../base_object.mjs"

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
import { CN_input_timesecond } from "./timesecond.mjs"
import { CN_input_typeahead } from "./typeahead.mjs"

export class CN_input extends CN_base_object {
  static create(type, params) {
    if ("audio_url" == type) return new CN_input_audio_url(params);
    if ("boolean" == type) return new CN_input_boolean(params);
    if ("color" == type) return new CN_input_color(params);
    if ("date" == type) return new CN_input_date(params);
    if ("datetime" == type) return new CN_input_datetime(params);
    if ("datetimesecond" == type) return new CN_input_datetimesecond(params);
    if ("dob" == type) return new CN_input_dob(params);
    if ("dod" == type) return new CN_input_dod(params);
    if ("email" == type) return new CN_input_email(params);
    if ("enum" == type) return new CN_input_enum(params);
    if ("file" == type) return new CN_input_file(params);
    if ("float" == type) return new CN_input_float(params);
    if ("integer" == type) return new CN_input_integer(params);
    if ("password" == type) return new CN_input_password(params);
    if ("rank" == type) return new CN_input_rank(params);
    if ("size" == type) return new CN_input_size(params);
    if ("string" == type) return new CN_input_string(params);
    if ("text" == type) return new CN_input_text(params);
    if ("time" == type) return new CN_input_time(params);
    if ("timesecond" == type) return new CN_input_timesecond(params);
    if ("typeahead" == type) return new CN_input_typeahead(params);

    throw new Error(`Tried to create invalid input type "${type}"`);
  }
}
