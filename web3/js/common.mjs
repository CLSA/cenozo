import CN_session from "./session.mjs"

/**
 * A object containing a number of helpful functions
 */
export default {
  /**
   * Returns whether a variable is a particular type
   * @param (dynamic) x: the variable to test
   * @param string type: the type to test for
   * @return boolean
   */
  is_type: function (x, type) {
    if ("class" == type) return this.is_type(x, "function") && x.toString().match(/^class/);
    if ("object" == type) return !this.is_type(x, "array") && "object" === typeof x && null != x;
    if ("array" == type) return Array.isArray(x);
    if ("blob" == type) return this.is_type(x, "object") && x instanceof Blob;
    if ("date" == type) return this.is_type(x, "object") && x instanceof Date;
    if ("element" == type) return this.is_type(x, "object") && (x instanceof Element || x instanceof HTMLDocument);
    if ("filelist" == type) return this.is_type(x, "object") && x instanceof FileList;
    if ("function" == type) return "function" === typeof x;
    if ("string" == type) return "string" === typeof x;
    if ("float" == type) return !isNaN(parseFloat(x)) && !isNaN(x-0);
    if ("integer" == type) return !isNaN(x) && parseInt(Number(x)) == x && !isNaN(parseInt(x, 10));
    return false;
  },

  /**
   * Returns whether a variable is an class
   * @param (dynamic) x: the variable to test
   * @return boolean
   */
  is_class: function (x) { return this.is_type(x, "class"); },

  /**
   * Returns whether a variable is an object
   * @param (dynamic) x: the variable to test
   * @return boolean
   */
  is_object: function (x) { return this.is_type(x, "object"); },

  /**
   * Returns whether a variable is an array
   * @param (dynamic) x: the variable to test
   * @return boolean
   */
  is_array: function (x) { return this.is_type(x, "array"); },

  /**
   * Returns whether a variable is a blob
   * @param (dynamic) x: the variable to test
   * @return boolean
   */
  is_blob: function (x) { return this.is_type(x, "blob"); },

  /**
   * Returns whether a variable is an element
   * @param (dynamic) x: the variable to test
   * @return boolean
   */
  is_element: function (x) { return this.is_type(x, "element"); },

  /**
   * Returns whether a variable is a FileList
   * @param (dynamic) x: the variable to test
   * @return boolean
   */
  is_filelist: function (x) { return this.is_type(x, "filelist"); },

  /**
   * Returns whether a variable is a function
   * @param (dynamic) x: the variable to test
   * @return boolean
   */
  is_function: function (x) { return this.is_type(x, "function"); },

  /**
   * Returns whether a variable is a string
   * @param (dynamic) x: the variable to test
   * @return boolean
   */
  is_string: function (x) { return this.is_type(x, "string"); },

  /**
   * Returns whether a variable is a float
   * @param (dynamic) x: the variable to test
   * @return boolean
   */
  is_float: function (x) { return this.is_type(x, "float"); },

  /**
   * Returns whether a variable is an integer
   * @param (dynamic) x: the variable to test
   * @return boolean
   */
  is_integer: function (x) { return this.is_type(x, "integer"); },

  /**
   * Returns a random identifier made up of hexidecimal digits
   * @param integer length: The number of digits
   * @return string
   */
  get_random_hex_identifier: function (length = 4) {
    return [...Array(length)].map(() => Math.floor(Math.random()*16).toString(16)).join('');
  },

  /**
   * Returns a string escaping all HTML entities
   * @param string x: The string to encode
   * @return string
   */
  escape_html: function (x) {
    return new Option(x).innerHTML;
  },

  /**
   * Returns a promise that resolves after the given delay
   * @param integer ms: The number of miliseconds to sleep for
   */
  sleep: function (ms) { return new Promise(res => setTimeout(res, ms)); },

  /**
   * Clones any variable (creating a perfect copy)
   * @param (dynamic) x: The variable to clone
   * @return (dynamic)
   */
  clone: function (x) {
    if (this.is_array(x)) {
      return x.map(item => this.clone(item));
    } else if (!this.is_object(x)) {
      return x;
    }

    let new_obj = {};
    for (const prop_name in x) {
      new_obj[prop_name] = this.clone(x[prop_name]);
    }

    return new_obj;
  },

  /**
   * ADD DOCS
   */
  get_month: function (index = null, loc = "en") {
    if (null != index) {
      const m = Number(index);
      if (!this.is_integer(m) || 0 > m || 11 < m) throw new Error("Tried to get month with invalid index.");
      // use a date such that the month can be set from a zero-based index
      const date = new Date(0);
      date.setUTCFullYear(2000);
      date.setUTCMonth(m);
      date.setUTCDate(2);
      date.setUTCHours(12);
      return date.toLocaleString(loc, { month: "long" });
    }

    // return the full list
    return new Array(12).fill(0).map((zero, i) => this.get_month(i, loc));
  },

  /**
   * ADD DOCS
   */
  get_weekday: function (index = null, loc = "en") {
    if (null != index) {
      const w = Number(index);
      if (!this.is_integer(w) || 0 > w || 6 < w) throw new Error("Tried to get weekday with invalid index.");
      // use a date such that the weekday can be set from a zero-based index
      const date = new Date(0);
      date.setUTCMonth(5);
      date.setUTCDate(w);
      date.setUTCHours(12);
      return date.toLocaleString(loc, { weekday: "long" });
    }

    // return the full list
    return new Array(7).fill(0).map((zero, i) => this.get_weekday(i, loc));
  },

  /**
   * Determines whether a particular type is a datetime
   * @param string type: The type to check
   * @param string subtype: A datetime sub-type to restrict to ("date", "time", "second")
   * @return boolean
   */
  is_datetime_type: function (type, subtype) {
    let type_list = [];
    if ("date" == subtype) {
      type_list = ["datetimesecond", "datetime", "date", "yearmonth", "dob", "dod"];
    } else if ("time" == subtype) {
      type_list = ["timesecond", "time"];
    } else if ("second" == subtype) {
      type_list = ["datetimesecond", "timesecond"];
    } else {
      type_list = [
        "datetimesecond",
        "datetime",
        "date",
        "yearmonth",
        "dob",
        "dod",
        "timesecond",
        "time",
      ];
    }

    return type_list.includes(type);
  },

  /**
   * Returns a time string representation of a datetime
   * @param string|Date value: The datetime to format
   * @param boolean am_pm: Whether to format using am_pm or 24-hour time
   * @param boolean seconds: Whether to include seconds
   * @return string
   */
  format_time: function (
    value,
    am_pm = CN_session.data.user.am_pm,
    seconds = false
  ) {
    let options = { hour12: am_pm, hour: am_pm ? "numeric" : "2-digit", minute: "2-digit" };
    if (seconds) options.second = "2-digit";
    return new Intl.DateTimeFormat('en-CA', options).format(new Date(value));
  },

  /**
   * Returns a datetime string representation of a datetime
   * @param string|Date value: The datetime to format
   * @param string format: Which format to use (yearmonth, dob, dod, date, datetime, datetimesecond, etc)
   * @param boolean am_pm: Whether to format using am_pm or 24-hour time
   * @param boolean long_form: Whether to format in long or short form
   * @return string
   */
  format_datetime: function (
    value,
    format,
    am_pm = CN_session.data.user.am_pm,
    long_form = false
  ) {
    let options = {};
    let include_date = true;
    let include_time = false;
    if ("yearmonth" == format) {
      options = { ...options, year: "numeric", month: "long" };
    } else if ("dob" == format || "dod" == format) {
      options = { ...options, year: "numeric", month: "short", day: "numeric" };
    } else if (this.is_datetime_type(format, "date")) {
      options = { ...options, year: "numeric", month: long_form ? "long" : "short", day: "numeric" };
      if (long_form) options.weekday = "long";
      include_time = "date" != format;
    } else if (this.is_datetime_type(format, "time")) {
      include_time = true;
    }

    let parts = [];
    if (include_date) {
      parts.push(
        new Intl.DateTimeFormat('en-CA', options).format(new Date(value))
      );
    }
    if (include_time) {
      parts.push(
        this.format_time(value, am_pm, this.is_datetime_type(format, "second"), long_form)
      );
    }
    return parts.join(" @ ");
  },

  /**
   * Returns a string representation of a file-size
   * @param boolean reverse: If true then convers a filesize string to an integer (in bytes)
   * @return string
   */
  format_filesize: function (input, reverse = false) {
    if (reverse && "empty" == input) return 0;
    if (!reverse && !input) return "empty";

    let output = input;
    if (reverse) {
      if (this.is_string(output)) {
        let parts = output.split(" ");
        if (2 == parts.length) {
          output = parts[0];
          let unit = parts[1];
          if ("KB" == unit) output *= 1024;
          if ("MB" == unit) output *= 1048576;
          if ("GB" == unit) output *= 1073741824;
          if ("TB" == unit) output *= 1099511627776;
          if ("PB" == unit) output *= 1125899906842624;
          if ("EB" == unit) output *= 1152921504606846976;
        }
      }
    } else {
      if (this.is_string(output)) output = parseInt(output);
      if (this.is_float(output)) {
        let unit_list = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB"];
        let unit_index = 0;
        while (output >= 1024) {
          output /= 1024;
          unit_index++;
        }
        output = Math.round(output * 100) / 100 + " " + unit_list[unit_index];
      }
    }

    return output;
  },

  /**
   * Converts the first character of a string to upper case
   * @param string str
   * @return string
   */
  uc_first: function (str) {
    return String(str).charAt(0).toUpperCase() + String(str).slice(1);
  },

  /**
   * Converts the first character of all words in a string to upper case
   * @param string str
   * @return string
   */
  uc_words: function (str) {
    return String(str).replace(
      /(^[a-z]| [a-z])/g,
      match => match.toUpperCase()
    );
  },

  /**
   * Returns a number along with its ordinal suffix (1st, 2nd, 3rd, 4th, etc)
   * @param integer number
   * @return string
   */
  ordinal_suffix: function (number) {
    let tens = number % 10, hundreds = number % 100;

    return number + (
      1 == tens && 11 != hundreds ? "st" :
      2 == tens && 12 != hundreds ? "nd" :
      3 == tens && 13 != hundreds ? "rd" :
      "th"
    );
  },

  /**
   * Convert a blob to data
   * @param type string: One of "base64", "buffer" or "text"
   * @param Blob blob: The blob to convert into data
   * @return string
   */
  convert_from_blob: async function (type, blob) {
    const convert = (blob) => new Promise((resolve, reject) => {
      const reader = new FileReader();
      if ("base64" == type) {
        reader.readAsDataURL(blob);
      } else if ("buffer" == type) {
        reader.readAsArrayBuffer(blob);
      } else if ("text" == type) {
        reader.readAsText(blob);
      } else {
        throw new Error(`Cannot convert blob to unknown type "${type}".`);
      }
      reader.addEventListener("load", () => resolve(reader.result));
      reader.addEventListener("error", reject);
    });
    return await convert(blob);
  },

  /**
   * Convert data to a blob
   * @param type string: One of "base64" (no other types implemented yet)
   * @param data string: The data to convert to a Blob (currently only base64 strings are accepted)
   * @param string content_type: The blob's mime type (optional)
   * @param integer slice_size: The number of bytes to push into the byte array at a time
   * @return Blob
   */
  convert_to_blob: function (type, data, content_type = "", slice_size = 512) {
    if ("base64" != type) throw new Error(`Cannot convert unknown type "${type}" to blob.`);

    // see if the content_type is in the data
    const match = data.match(/^data:[^;]+;[^,]+,(.+)/);
    if (null != match) {
      data = match[1];
      if ("" == content_type) content_type = match[0];
    }

    const byte_characters = atob(data);
    const byte_arrays = [];

    for (let offset = 0; offset < byte_characters.length; offset += slice_size) {
      const slice = byte_characters.slice(offset, offset + slice_size);
      const byte_numbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) byte_numbers[i] = slice.charCodeAt(i);
      const byte_array = new Uint8Array(byte_numbers);
      byte_arrays.push(byte_array);
    }

    return new Blob(byte_arrays, {type: content_type});
  },

  /**
   * Provides a way for the end-user to download a file
   * @param Blob|string file: The file either as a blob or base64-encoded string
   * @param string filename: The name of the file the end-user will download
   */
  download_file: function (file, filename) {
    let blob = null;
    if (this.is_blob(file)) blob = file;
    else if (this.is_string(file)) blob = this.convert_to_blob("base64", file);
    else throw new Error("Tried to download file but first argument is neither a blob or string.");

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  },

  /**
   * Converts a column or table name to a user-friendly string
   * @param string type
   * @param string name
   * @return string
   */
  pretty_print: function (type, name) {
    if ("column" == type) {
      return (
        this.is_string(name) ?
        this.uc_words(name.replace(/_/g, " ")).replace(/\b(Id|Uid)\b/, x => x.toUpperCase()) :
        name
      )
    } else if ("table" == type) {
      return this.is_string(name) ? this.uc_words(name.replace(/_/g, " ")) : name;
    }

    console.warn(`Tried to pretty-print type "${type}" which isn't implemented.`);
    return name;
  },
}
