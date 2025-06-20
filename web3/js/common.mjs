// COMMON

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
  is_type: function(x, type) {
    if ("object" == type) return "object" === typeof x && null != x;
    if ("array" == type) return Array.isArray(x);
    if ("function" == type) return "function" === typeof x;
    if ("string" == type) return "string" === typeof x;
    if ("float" == type) return !isNaN(parseFloat(x)) && !isNaN(x-0);
    if ("integer" == type) return !isNaN(x) && parseInt(Number(x)) == x && !isNaN(parseInt(x, 10));
    return false;
  },

  /**
   * Returns whether a variable is an object
   * @param (dynamic) x: the variable to test
   * @return boolean
   */
  is_object: function(x) { return this.is_type(x, "object"); },

  /**
   * Returns whether a variable is an array
   * @param (dynamic) x: the variable to test
   * @return boolean
   */
  is_array: function (x) { return this.is_type(x, "array"); },

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
    for(var prop_name in x) {
      new_obj[prop_name] = this.clone(x[prop_name]);
    }

    return new_obj;
  },

  /**
   * Determines whether a particular type is a datetime
   * @param string type: The type to check
   * @param string subtype: A datetime sub-type to restrict to ("date", "time", "second", "timezone")
   * @return boolean
   */
  is_datetime_type: function (type, subtype) {
    var type_list = [];
    if ("date" == subtype) {
      type_list = ["datetimesecond", "datetime", "date", "yearmonth", "dob", "dod"];
    } else if ("time" == subtype) {
      type_list = ["timesecond", "timesecond_notz", "time", "time_notz"];
    } else if ("second" == subtype) {
      type_list = ["datetimesecond", "timesecond", "timesecond_notz"];
    } else if ("timezone" == subtype) {
      type_list = ["datetimesecond", "datetime", "timesecond", "time"];
    } else {
      type_list = [
        "datetimesecond",
        "datetime",
        "date",
        "yearmonth",
        "dob",
        "dod",
        "timesecond",
        "timesecond_notz",
        "time",
        "time_notz",
      ];
    }

    return type_list.includes(type);
  },

  /**
   * Returns the moment-based datetime format
   * @param string format: Any date format including "yearmonth", "dob", "dod", "datetime", "date", "time", etc
   * @param boolean am_pm: Whether to format using am_pm or 24-hour time
   * @param boolean long_form: Whether to format in long or short form
   * @return string
   */
  get_datetime_format: function(format, am_pm = false, long_form = false) {
    var resolved_format = format;
    if ("yearmonth" == format) {
      resolved_format = "MMMM, YYYY";
    } else if ("dob" == format || "dod" == format) {
      resolved_format = "MMM D, YYYY";
    } else if (this.is_datetime_type(format, "date")) {
      resolved_format = (long_form ? "dddd, MMMM Do" : "MMM D") + ", YYYY";
      if ("date" != format) {
        resolved_format += (
          " @ " +
          this.get_time_format(
            am_pm,
            this.is_datetime_type(format, "second"),
            long_form
          )
        );
      }
    } else if (this.is_datetime_type(format, "time")) {
      resolved_format = this.get_time_format(
        am_pm,
        this.is_datetime_type(format, "second"),
        false
      );
    }
    return resolved_format;
  },

  /**
   * Returns the moment-based time format
   * @param boolean am_pm: Whether to format using am_pm or 24-hour time
   * @param boolean seconds: Whether to include seconds
   * @param boolean timezone: Whether to include the timezone
   * @return string
   */
  get_time_format: function(am_pm = false, seconds = false, timezone = false) {
    let h = am_pm ? "h" : "H";
    let s = seconds ? ":ss" : "";
    let a = am_pm ? "a" : "";
    let z = timezone ? " z" : "";
    return `${h}:mm${s}${a}${z}`;
  },

  /**
   * Converts the first character of a string to upper case
   * @param string str
   * @return string
   */
  uc_first: function(str) {
    return String(str).charAt(0).toUpperCase() + String(str).slice(1);
  },

  /**
   * Converts the first character of all words in a string to upper case
   * @param string str
   * @return string
   */
  uc_words: function(str) {
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
  ordinal_suffix(number) {
    let tens = number % 10, hundreds = number % 100;

    return number + (
      1 == tens && 11 != hundreds ? "st" :
      2 == tens && 12 != hundreds ? "nd" :
      3 == tens && 13 != hundreds ? "rd" :
      "th"
    );
  }

}
