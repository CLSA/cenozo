import CN_session from "./session.mjs"

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
   * Returns a time string representation of a datetime
   * @param string|Date value: The datetime to format
   * @param string timezone: Which timezone to use
   * @param boolean am_pm: Whether to format using am_pm or 24-hour time
   * @param boolean seconds: Whether to include seconds
   * @param boolean show_timezone: Whether to include the timezone
   * @return string
   */
  format_time: function(
    value,
    timezone = CN_session.data.user.timezone,
    am_pm = CN_session.data.user.am_pm,
    seconds = false,
    show_timezone = false
  ) {
    let options = { timeZone: timezone, hour12: am_pm, hour: am_pm ? "numeric" : "2-digit", minute: "2-digit" };
    if (seconds) options.second = "2-digit";
    if (show_timezone) options.timeZoneName = "short";
    return new Intl.DateTimeFormat('en-CA', options).format(new Date(value));
  },

  /**
   * Returns a datetime string representation of a datetime
   * @param string|Date value: The datetime to format
   * @param string format: Which format to use (yearmonth, dob, dod, date, datetime, datetimesecond, etc)
   * @param string timezone: Which timezone to use
   * @param boolean am_pm: Whether to format using am_pm or 24-hour time
   * @param boolean long_form: Whether to format in long or short form
   * @return string
   */
  format_datetime: function(
    value,
    format,
    timezone = CN_session.data.user.timezone,
    am_pm = CN_session.data.user.am_pm,
    long_form = false
  ) {
    let options = { timeZone: timezone };
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
        this.format_time(value, timezone, am_pm, this.is_datetime_type(format, "second"), long_form)
      );
    }
    return parts.join(" @ ");
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
  },

}
