import { CN_base_object } from "./base_object.mjs"
import { CN_common } from "./common.mjs"

export class CN_i18n extends CN_base_object {
  #data = {};
  #default_lang = "en";

  /**
   * ADD DOCS
   */
  set_data(data) {
    if (!CN_common.is_object(data) || 0 == Object.keys(data).length) {
      console.error("Tried to set i18n to invalid data.");
    } else {
      this.#data = data;
      this.#default_lang = Object.keys(this.#data)[0];
    }
  }

  /**
   * ADD DOCS
   */
  get(lang, path, params = {}) {
    if (!lang) lang = this.#default_lang;
    let node = null;
    let object_path = [lang];
    if ("string" === typeof path) object_path = object_path.concat(path.split("."));

    // try finding the path in the requested language
    node = this.#data;
    object_path.forEach(name => node = CN_common.is_object(node) && node[name] ? node[name] : null);

    // if not found then look in the default language instead
    if (null == node && lang != this.#default_lang) {
      object_path[0] = this.#default_lang;
      node = this.#data;
      object_path.forEach(name => node = CN_common.is_object(node) && node[name] ? node[name] : null);
    }

    return (
      null == node ?
      "I18N_MISSING" :
      "string" === typeof node ?
      node.replace(/\${(.*?)}/g, (match, name) => params[name.trim()] ? params[name.trim()] : "") :
      node
    );
  }
}
