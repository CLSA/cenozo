import { CN_base_object } from "./base_object.mjs"
import { CN_session } from "./session.mjs"

/**
 * A object containing a number of helpful functions
 */
export class CN_common extends CN_base_object {
  constructor() {
    throw new Error("Abstract class CN_common can't be instantiated.");
  }

  /**
   * Returns whether a variable is a particular type
   * @param (dynamic) x: the variable to test
   * @param string type: the type to test for
   * @return boolean
   */
  static is_type(x, type) {
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
  }

  /**
   * Returns whether a variable is an class
   * @param (dynamic) x: the variable to test
   * @return boolean
   */
  static is_class(x) { return this.is_type(x, "class"); }

  /**
   * Returns whether a variable is an object
   * @param (dynamic) x: the variable to test
   * @return boolean
   */
  static is_object(x) { return this.is_type(x, "object"); }

  /**
   * Returns whether a variable is an array
   * @param (dynamic) x: the variable to test
   * @return boolean
   */
  static is_array(x) { return this.is_type(x, "array"); }

  /**
   * Returns whether a variable is a blob
   * @param (dynamic) x: the variable to test
   * @return boolean
   */
  static is_blob(x) { return this.is_type(x, "blob"); }

  /**
   * Returns whether a variable is a date
   * @param (dynamic) x: the variable to test
   * @return boolean
   */
  static is_date(x) { return this.is_type(x, "date"); }

  /**
   * Returns whether a variable is an element
   * @param (dynamic) x: the variable to test
   * @return boolean
   */
  static is_element(x) { return this.is_type(x, "element"); }

  /**
   * Returns whether a variable is a FileList
   * @param (dynamic) x: the variable to test
   * @return boolean
   */
  static is_filelist(x) { return this.is_type(x, "filelist"); }

  /**
   * Returns whether a variable is a function
   * @param (dynamic) x: the variable to test
   * @return boolean
   */
  static is_function(x) { return this.is_type(x, "function"); }

  /**
   * Returns whether a variable is a string
   * @param (dynamic) x: the variable to test
   * @return boolean
   */
  static is_string(x) { return this.is_type(x, "string"); }

  /**
   * Returns whether a variable is a float
   * @param (dynamic) x: the variable to test
   * @return boolean
   */
  static is_float(x) { return this.is_type(x, "float"); }

  /**
   * Returns whether a variable is an integer
   * @param (dynamic) x: the variable to test
   * @return boolean
   */
  static is_integer(x) { return this.is_type(x, "integer"); }

  /**
   * Returns a random identifier made up of hexidecimal digits
   * @param integer length: The number of digits
   * @return string
   */
  static get_random_hex_identifier(length = 4) {
    return [...Array(length)].map(() => Math.floor(Math.random()*16).toString(16)).join('');
  }

  /**
   * Returns a string escaping all HTML entities
   * @param string x: The string to encode
   * @return string
   */
  static escape_html(x) {
    return new Option(x).innerHTML;
  }

  /**
   * Returns a promise that resolves after the given delay
   * @param integer ms: The number of milliseconds to sleep for
   */
  static sleep(ms) { return new Promise(res => setTimeout(res, ms)); }

  /**
   * Clones any variable (creating a perfect copy)
   * @param (dynamic) x: The variable to clone
   * @return (dynamic)
   */
  static clone(x) {
    if (this.is_array(x)) {
      return x.map(item => this.clone(item));
    } else if (this.is_blob(x)) {
      return x.slice();
    } else if (this.is_date(x)) {
      return new Date(x.getTime());
    } else if (this.is_element(x)) {
      return x.cloneNode(true);
    } else if (this.is_filelist(x)) {
      throw new Error("Cannot clone file lists.");
    } else if (!this.is_object(x)) {
      return x;
    }

    let new_obj = {};
    for (const prop_name in x) {
      new_obj[prop_name] = this.clone(x[prop_name]);
    }

    return new_obj;
  }

  /**
   * ADD DOCS
   */
  static get_month(index = null, loc = "en") {
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
  }

  /**
   * ADD DOCS
   */
  static get_weekday(index = null, loc = "en", type = "long") {
    if (null != index) {
      const w = Number(index);
      if (!this.is_integer(w) || 0 > w || 6 < w) throw new Error("Tried to get weekday with invalid index.");
      // use a date such that the weekday can be set from a zero-based index
      const date = new Date(0);
      date.setUTCMonth(5);
      date.setUTCDate(w);
      date.setUTCHours(12);
      return date.toLocaleString(loc, { weekday: type });
    }

    // return the full list
    return new Array(7).fill(0).map((zero, i) => this.get_weekday(i, loc, type));
  }

  /**
   * Determines whether a particular type is a datetime
   * @param string type: The type to check
   * @param string subtype: A datetime sub-type to restrict to ("date", "time", "second")
   * @return boolean
   */
  static is_datetime_type(type, subtype) {
    let type_list = [];
    if ("date" == subtype) {
      type_list = ["datetimesecond", "datetime", "date", "dob", "dod"];
    } else if ("time" == subtype) {
      type_list = ["timesecond", "time"];
    } else if ("second" == subtype) {
      type_list = ["datetimesecond", "timesecond"];
    } else {
      type_list = ["datetimesecond", "datetime", "date", "dob", "dod", "timesecond", "time"];
    }

    return type_list.includes(type);
  }

  /**
   * Returns a time string representation of a datetime
   * @param string|Date value: The datetime to format
   * @param boolean am_pm: Whether to format using am_pm or 24-hour time
   * @param boolean seconds: Whether to include seconds
   * @return string
   */
  static format_time(value, seconds = false, am_pm = CN_session.data.user.am_pm) {
    let options = { hour12: am_pm, hour: am_pm ? "numeric" : "2-digit", minute: "2-digit" };
    if (seconds) options.second = "2-digit";
    return new Intl.DateTimeFormat('en-CA', options).format(new Date(value));
  }

  /**
   * Returns a datetime string representation of a datetime
   * @param string|Date value: The datetime to format
   * @param string format: Which format to use (record, dob, dod, date, datetime, datetimesecond, etc)
   * @param boolean am_pm: Whether to format using am_pm or 24-hour time
   * @param boolean long_form: Whether to format in long or short form
   * @return string
   */
  static format_datetime(value, format, long_form = false, am_pm = CN_session.data.user.am_pm) {
    if (null == value) {
      return null;
    } else if (this.is_string(value)) {
      value = new Date(value);
    }

    if ("record" == format) {
      return value.toISOString().substr(0, 10) + " " + value.toTimeString().substr(0, 8);
    }

    let options = {};
    let include_date = true;
    let include_time = false;
    if ("dob" == format || "dod" == format) {
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
      parts.push(new Intl.DateTimeFormat('en-CA', options).format(value));
    }
    if (include_time) {
      parts.push(this.format_time(value, am_pm, this.is_datetime_type(format, "second"), long_form));
    }
    return parts.join(" @ ");
  }

  /**
   * Returns a string representation of a file-size
   * @param boolean reverse: If true then convers a filesize string to an integer (in bytes)
   * @return string
   */
  static format_filesize(input, reverse = false) {
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
        }
      }
    } else {
      if (this.is_string(output)) output = parseInt(output);
      if (this.is_float(output)) {
        let unit_list = ["Bytes", "KB", "MB", "GB", "TB", "PB"];
        let unit_index = 0;
        while (output >= 1024) {
          output /= 1024;
          unit_index++;
        }
        output = Math.round(output * 100) / 100 + " " + unit_list[unit_index];
      }
    }

    return output;
  }

  /**
   * Converts the first character of a string to upper case
   * @param string str
   * @return string
   */
  static uc_first(str) {
    return String(str).charAt(0).toUpperCase() + String(str).slice(1);
  }

  /**
   * Converts the first character of all words in a string to upper case
   * @param string str
   * @return string
   */
  static uc_words(str) {
    return String(str).replace(
      /(^[a-z]| [a-z])/g,
      match => match.toUpperCase()
    );
  }

  /**
   * Returns a number along with its ordinal suffix (1st, 2nd, 3rd, 4th, etc)
   * @param integer number
   * @return string
   */
  static ordinal_suffix(number) {
    let tens = number % 10, hundreds = number % 100;

    return number + (
      1 == tens && 11 != hundreds ? "st" :
      2 == tens && 12 != hundreds ? "nd" :
      3 == tens && 13 != hundreds ? "rd" :
      "th"
    );
  }

  /**
   * Convert a blob to data
   * @param type string: One of "base64", "buffer" or "text"
   * @param Blob blob: The blob to convert into data
   * @return string
   */
  static async convert_from_blob(type, blob) {
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
  }

  /**
   * Convert data to a blob
   * @param type string: One of "base64" (no other types implemented yet)
   * @param data string: The data to convert to a Blob (currently only base64 strings are accepted)
   * @param string content_type: The blob's mime type (optional)
   * @param integer slice_size: The number of bytes to push into the byte array at a time
   * @return Blob
   */
  static convert_to_blob(type, data, content_type = "", slice_size = 512) {
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
  }

  /**
   * Provides a way for the end-user to download a file
   * @param Blob|string file: The file either as a blob or base64-encoded string
   * @param string filename: The name of the file the end-user will download
   */
  static download_file(file, filename) {
    let blob = null;
    if (this.is_blob(file)) blob = file;
    else if (this.is_string(file)) blob = this.convert_to_blob("base64", file);
    else throw new Error("Tried to download file but first argument is neither a blob or string.");

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  /**
   * Converts a column or table name to a user-friendly string
   * @param string type
   * @param string name
   * @return string
   */
  static pretty_print(type, name) {
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
  }

  /**
   * Returns an array of all timezones
   * @return []
   */
  static get_timezones() {
    return [
      "Africa/Abidjan", "Africa/Accra", "Africa/Addis_Ababa", "Africa/Algiers", "Africa/Asmara", "Africa/Asmera",
      "Africa/Bamako", "Africa/Bangui", "Africa/Banjul", "Africa/Bissau", "Africa/Blantyre", "Africa/Brazzaville",
      "Africa/Bujumbura", "Africa/Cairo", "Africa/Casablanca", "Africa/Ceuta", "Africa/Conakry", "Africa/Dakar",
      "Africa/Dar_es_Salaam", "Africa/Djibouti", "Africa/Douala", "Africa/El_Aaiun", "Africa/Freetown",
      "Africa/Gaborone", "Africa/Harare", "Africa/Johannesburg", "Africa/Juba", "Africa/Kampala",
      "Africa/Khartoum", "Africa/Kigali", "Africa/Kinshasa", "Africa/Lagos", "Africa/Libreville", "Africa/Lome",
      "Africa/Luanda", "Africa/Lubumbashi", "Africa/Lusaka", "Africa/Malabo", "Africa/Maputo", "Africa/Maseru",
      "Africa/Mbabane", "Africa/Mogadishu", "Africa/Monrovia", "Africa/Nairobi", "Africa/Ndjamena",
      "Africa/Niamey", "Africa/Nouakchott", "Africa/Ouagadougou", "Africa/Porto-Novo", "Africa/Sao_Tome",
      "Africa/Timbuktu", "Africa/Tripoli", "Africa/Tunis", "Africa/Windhoek", "America/Adak", "America/Anchorage",
      "America/Anguilla", "America/Antigua", "America/Araguaina", "America/Argentina/Buenos_Aires",
      "America/Argentina/Catamarca", "America/Argentina/ComodRivadavia", "America/Argentina/Cordoba",
      "America/Argentina/Jujuy", "America/Argentina/La_Rioja", "America/Argentina/Mendoza",
      "America/Argentina/Rio_Gallegos", "America/Argentina/Salta", "America/Argentina/San_Juan",
      "America/Argentina/San_Luis", "America/Argentina/Tucuman", "America/Argentina/Ushuaia", "America/Aruba",
      "America/Asuncion", "America/Atikokan", "America/Atka", "America/Bahia", "America/Bahia_Banderas",
      "America/Barbados", "America/Belem", "America/Belize", "America/Blanc-Sablon", "America/Boa_Vista",
      "America/Bogota", "America/Boise", "America/Buenos_Aires", "America/Cambridge_Bay", "America/Campo_Grande",
      "America/Cancun", "America/Caracas", "America/Catamarca", "America/Cayenne", "America/Cayman",
      "America/Chicago", "America/Chihuahua", "America/Ciudad_Juarez", "America/Coral_Harbour", "America/Cordoba",
      "America/Costa_Rica", "America/Coyhaique", "America/Creston", "America/Cuiaba", "America/Curacao",
      "America/Danmarkshavn", "America/Dawson", "America/Dawson_Creek", "America/Denver", "America/Detroit",
      "America/Dominica", "America/Edmonton", "America/Eirunepe", "America/El_Salvador", "America/Ensenada",
      "America/Fortaleza", "America/Fort_Nelson", "America/Fort_Wayne", "America/Glace_Bay", "America/Godthab",
      "America/Goose_Bay", "America/Grand_Turk", "America/Grenada", "America/Guadeloupe", "America/Guatemala",
      "America/Guayaquil", "America/Guyana", "America/Halifax", "America/Havana", "America/Hermosillo",
      "America/Indiana/Indianapolis", "America/Indiana/Knox", "America/Indiana/Marengo",
      "America/Indiana/Petersburg", "America/Indianapolis", "America/Indiana/Tell_City", "America/Indiana/Vevay",
      "America/Indiana/Vincennes", "America/Indiana/Winamac", "America/Inuvik", "America/Iqaluit",
      "America/Jamaica", "America/Jujuy", "America/Juneau", "America/Kentucky/Louisville",
      "America/Kentucky/Monticello", "America/Knox_IN", "America/Kralendijk", "America/La_Paz", "America/Lima",
      "America/Los_Angeles", "America/Louisville", "America/Lower_Princes", "America/Maceio", "America/Managua",
      "America/Manaus", "America/Marigot", "America/Martinique", "America/Matamoros", "America/Mazatlan",
      "America/Mendoza", "America/Menominee", "America/Merida", "America/Metlakatla", "America/Mexico_City",
      "America/Miquelon", "America/Moncton", "America/Monterrey", "America/Montevideo", "America/Montreal",
      "America/Montserrat", "America/Nassau", "America/New_York", "America/Nipigon", "America/Nome",
      "America/Noronha", "America/North_Dakota/Beulah", "America/North_Dakota/Center",
      "America/North_Dakota/New_Salem", "America/Nuuk", "America/Ojinaga", "America/Panama", "America/Pangnirtung",
      "America/Paramaribo", "America/Phoenix", "America/Port-au-Prince", "America/Porto_Acre",
      "America/Port_of_Spain", "America/Porto_Velho", "America/Puerto_Rico", "America/Punta_Arenas",
      "America/Rainy_River", "America/Rankin_Inlet", "America/Recife", "America/Regina", "America/Resolute",
      "America/Rio_Branco", "America/Rosario", "America/Santa_Isabel", "America/Santarem", "America/Santiago",
      "America/Santo_Domingo", "America/Sao_Paulo", "America/Scoresbysund", "America/Shiprock", "America/Sitka",
      "America/St_Barthelemy", "America/St_Johns", "America/St_Kitts", "America/St_Lucia", "America/St_Thomas",
      "America/St_Vincent", "America/Swift_Current", "America/Tegucigalpa", "America/Thule", "America/Thunder_Bay",
      "America/Tijuana", "America/Toronto", "America/Tortola", "America/Vancouver", "America/Virgin",
      "America/Whitehorse", "America/Winnipeg", "America/Yakutat", "America/Yellowknife", "Antarctica/Casey",
      "Antarctica/Davis", "Antarctica/DumontDUrville", "Antarctica/Macquarie", "Antarctica/Mawson",
      "Antarctica/McMurdo", "Antarctica/Palmer", "Antarctica/Rothera", "Antarctica/South_Pole", "Antarctica/Syowa",
      "Antarctica/Troll", "Antarctica/Vostok", "Arctic/Longyearbyen", "Asia/Aden", "Asia/Almaty", "Asia/Amman",
      "Asia/Anadyr", "Asia/Aqtau", "Asia/Aqtobe", "Asia/Ashgabat", "Asia/Ashkhabad", "Asia/Atyrau", "Asia/Baghdad",
      "Asia/Bahrain", "Asia/Baku", "Asia/Bangkok", "Asia/Barnaul", "Asia/Beirut", "Asia/Bishkek", "Asia/Brunei",
      "Asia/Calcutta", "Asia/Chita", "Asia/Choibalsan", "Asia/Chongqing", "Asia/Chungking", "Asia/Colombo",
      "Asia/Dacca", "Asia/Damascus", "Asia/Dhaka", "Asia/Dili", "Asia/Dubai", "Asia/Dushanbe", "Asia/Famagusta",
      "Asia/Gaza", "Asia/Harbin", "Asia/Hebron", "Asia/Ho_Chi_Minh", "Asia/Hong_Kong", "Asia/Hovd", "Asia/Irkutsk",
      "Asia/Istanbul", "Asia/Jakarta", "Asia/Jayapura", "Asia/Jerusalem", "Asia/Kabul", "Asia/Kamchatka",
      "Asia/Karachi", "Asia/Kashgar", "Asia/Kathmandu", "Asia/Katmandu", "Asia/Khandyga", "Asia/Kolkata",
      "Asia/Krasnoyarsk", "Asia/Kuala_Lumpur", "Asia/Kuching", "Asia/Kuwait", "Asia/Macao", "Asia/Macau",
      "Asia/Magadan", "Asia/Makassar", "Asia/Manila", "Asia/Muscat", "Asia/Nicosia", "Asia/Novokuznetsk",
      "Asia/Novosibirsk", "Asia/Omsk", "Asia/Oral", "Asia/Phnom_Penh", "Asia/Pontianak", "Asia/Pyongyang",
      "Asia/Qatar", "Asia/Qostanay", "Asia/Qyzylorda", "Asia/Rangoon", "Asia/Riyadh", "Asia/Saigon",
      "Asia/Sakhalin", "Asia/Samarkand", "Asia/Seoul", "Asia/Shanghai", "Asia/Singapore", "Asia/Srednekolymsk",
      "Asia/Taipei", "Asia/Tashkent", "Asia/Tbilisi", "Asia/Tehran", "Asia/Tel_Aviv", "Asia/Thimbu",
      "Asia/Thimphu", "Asia/Tokyo", "Asia/Tomsk", "Asia/Ujung_Pandang", "Asia/Ulaanbaatar", "Asia/Ulan_Bator",
      "Asia/Urumqi", "Asia/Ust-Nera", "Asia/Vientiane", "Asia/Vladivostok", "Asia/Yakutsk", "Asia/Yangon",
      "Asia/Yekaterinburg", "Asia/Yerevan", "Atlantic/Azores", "Atlantic/Bermuda", "Atlantic/Canary",
      "Atlantic/Cape_Verde", "Atlantic/Faeroe", "Atlantic/Faroe", "Atlantic/Jan_Mayen", "Atlantic/Madeira",
      "Atlantic/Reykjavik", "Atlantic/South_Georgia", "Atlantic/Stanley", "Atlantic/St_Helena", "Australia/ACT",
      "Australia/Adelaide", "Australia/Brisbane", "Australia/Broken_Hill", "Australia/Canberra",
      "Australia/Currie", "Australia/Darwin", "Australia/Eucla", "Australia/Hobart", "Australia/LHI",
      "Australia/Lindeman", "Australia/Lord_Howe", "Australia/Melbourne", "Australia/North", "Australia/NSW",
      "Australia/Perth", "Australia/Queensland", "Australia/South", "Australia/Sydney", "Australia/Tasmania",
      "Australia/Victoria", "Australia/West", "Australia/Yancowinna", "Brazil/Acre", "Brazil/DeNoronha",
      "Brazil/East", "Brazil/West", "Canada/Atlantic", "Canada/Central", "Canada/Eastern", "Canada/Mountain",
      "Canada/Newfoundland", "Canada/Pacific", "Canada/Saskatchewan", "Canada/Yukon", "CET", "Chile/Continental",
      "Chile/EasterIsland", "CST6CDT", "Cuba", "EET", "Egypt", "Eire", "EST", "EST5EDT", "Etc/GMT", "Etc/GMT+0",
      "Etc/GMT-0", "Etc/GMT0", "Etc/GMT+1", "Etc/GMT-1", "Etc/GMT+10", "Etc/GMT-10", "Etc/GMT+11", "Etc/GMT-11",
      "Etc/GMT+12", "Etc/GMT-12", "Etc/GMT-13", "Etc/GMT-14", "Etc/GMT+2", "Etc/GMT-2", "Etc/GMT+3", "Etc/GMT-3",
      "Etc/GMT+4", "Etc/GMT-4", "Etc/GMT+5", "Etc/GMT-5", "Etc/GMT+6", "Etc/GMT-6", "Etc/GMT+7", "Etc/GMT-7",
      "Etc/GMT+8", "Etc/GMT-8", "Etc/GMT+9", "Etc/GMT-9", "Etc/Greenwich", "Etc/UCT", "Etc/Universal", "Etc/UTC",
      "Etc/Zulu", "Europe/Amsterdam", "Europe/Andorra", "Europe/Astrakhan", "Europe/Athens", "Europe/Belfast",
      "Europe/Belgrade", "Europe/Berlin", "Europe/Bratislava", "Europe/Brussels", "Europe/Bucharest",
      "Europe/Budapest", "Europe/Busingen", "Europe/Chisinau", "Europe/Copenhagen", "Europe/Dublin",
      "Europe/Gibraltar", "Europe/Guernsey", "Europe/Helsinki", "Europe/Isle_of_Man", "Europe/Istanbul",
      "Europe/Jersey", "Europe/Kaliningrad", "Europe/Kiev", "Europe/Kirov", "Europe/Kyiv", "Europe/Lisbon",
      "Europe/Ljubljana", "Europe/London", "Europe/Luxembourg", "Europe/Madrid", "Europe/Malta",
      "Europe/Mariehamn", "Europe/Minsk", "Europe/Monaco", "Europe/Moscow", "Europe/Nicosia", "Europe/Oslo",
      "Europe/Paris", "Europe/Podgorica", "Europe/Prague", "Europe/Riga", "Europe/Rome", "Europe/Samara",
      "Europe/San_Marino", "Europe/Sarajevo", "Europe/Saratov", "Europe/Simferopol", "Europe/Skopje",
      "Europe/Sofia", "Europe/Stockholm", "Europe/Tallinn", "Europe/Tirane", "Europe/Tiraspol", "Europe/Ulyanovsk",
      "Europe/Uzhgorod", "Europe/Vaduz", "Europe/Vatican", "Europe/Vienna", "Europe/Vilnius", "Europe/Volgograd",
      "Europe/Warsaw", "Europe/Zagreb", "Europe/Zaporozhye", "Europe/Zurich", "Factory", "GB", "GB-Eire", "GMT",
      "GMT+0", "GMT-0", "GMT0", "Greenwich", "Hongkong", "HST", "Iceland", "Indian/Antananarivo", "Indian/Chagos",
      "Indian/Christmas", "Indian/Cocos", "Indian/Comoro", "Indian/Kerguelen", "Indian/Mahe", "Indian/Maldives",
      "Indian/Mauritius", "Indian/Mayotte", "Indian/Reunion", "Iran", "Israel", "Jamaica", "Japan", "Kwajalein",
      "Libya", "MET", "Mexico/BajaNorte", "Mexico/BajaSur", "Mexico/General", "MST", "MST7MDT", "Navajo", "NZ",
      "NZ-CHAT", "Pacific/Apia", "Pacific/Auckland", "Pacific/Bougainville", "Pacific/Chatham", "Pacific/Chuuk",
      "Pacific/Easter", "Pacific/Efate", "Pacific/Enderbury", "Pacific/Fakaofo", "Pacific/Fiji",
      "Pacific/Funafuti", "Pacific/Galapagos", "Pacific/Gambier", "Pacific/Guadalcanal", "Pacific/Guam",
      "Pacific/Honolulu", "Pacific/Johnston", "Pacific/Kanton", "Pacific/Kiritimati", "Pacific/Kosrae",
      "Pacific/Kwajalein", "Pacific/Majuro", "Pacific/Marquesas", "Pacific/Midway", "Pacific/Nauru",
      "Pacific/Niue", "Pacific/Norfolk", "Pacific/Noumea", "Pacific/Pago_Pago", "Pacific/Palau",
      "Pacific/Pitcairn", "Pacific/Pohnpei", "Pacific/Ponape", "Pacific/Port_Moresby", "Pacific/Rarotonga",
      "Pacific/Saipan", "Pacific/Samoa", "Pacific/Tahiti", "Pacific/Tarawa", "Pacific/Tongatapu", "Pacific/Truk",
      "Pacific/Wake", "Pacific/Wallis", "Pacific/Yap", "Poland", "Portugal", "PRC", "PST8PDT", "ROC", "ROK",
      "Singapore", "Turkey", "UCT", "Universal", "US/Alaska", "US/Aleutian", "US/Arizona", "US/Central",
      "US/Eastern", "US/East-Indiana", "US/Hawaii", "US/Indiana-Starke", "US/Michigan", "US/Mountain",
      "US/Pacific", "US/Samoa", "UTC", "WET", "W-SU", "Zulu"
    ];
  }
}
