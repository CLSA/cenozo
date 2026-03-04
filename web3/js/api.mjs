import { CN_common } from "./common.mjs"
import { CN_session } from "./session.mjs"

import { CN_modal_message } from "./element/modal/message.mjs"
import { CN_base_object } from "./base_object.mjs"

const SELECT_SHORT_NAMES = {
  alias: 'a',
  column: 'c',
  distinct: 'd',
  from: 'f',
  table_prefix: 'p',
  table: 't',
};
const SELECT_LONG_NAMES = {};
for (const long in SELECT_SHORT_NAMES) SELECT_LONG_NAMES[SELECT_SHORT_NAMES[long]] = long;

const MODIFIER_SHORT_NAMES = {
  alias: 'a',
  bracket: 'b',
  column: 'c',
  having: 'h',
  join: 'j',
  limit: 'l',
  open: 'n',
  order: 'o',
  offset: 'off',
  onleft: 'onl',
  operator: 'op',
  onright: 'onr',
  prepend: 'p',
  table: 't',
  type: 'tp',
  value: 'v',
  where: 'w',
};
const MODIFIER_LONG_NAMES = {};
for (const long in MODIFIER_SHORT_NAMES) MODIFIER_LONG_NAMES[MODIFIER_SHORT_NAMES[long]] = long;

/**
 * The API class provides a way to communicate with the server's API
 *
 * Fetch methods (get/patch/post/delete) automatically prepend the API's path so only reletive paths must
 * be provided.  These methods also automatically format select and modifier objects and handle various
 * response codes returned by the API.
 */
export class CN_api extends CN_base_object {
  constructor() {
    throw new Error("Abstract class CN_api can't be instantiated.");
  }

  /**
   * Fetch method used for all API calls, returns the result from calling the native fetch() function
   * @param strign path: The relative API path
   * @param object params: Query URI parameters
   * @param object options: Fetch options passed directly to the native fetch() function
   * @return Response
   */
  static async fetch(path, params, options) {
    let url = `${ROOT_URL}/api/${path}`;

    if (CN_common.is_object(params)) {
      // encode select and modifier parameters
      if (params.select) params.select = this.select(params.select);
      if (params.modifier) params.modifier = this.modifier(params.modifier);
      const url_search_params = new URLSearchParams(params);
      url += `?${url_search_params.toString()}`;
    } else if (CN_common.is_string(params)) {
      url += `?${params}`;
    }

    const response = await fetch(url, options);

    // validate the user's session status
    const site_id = response.headers.get('X-Site');
    const user_id = response.headers.get('X-User');
    const role_id = response.headers.get('X-Role');

    if (null == user_id) {
      // the session has expired, reload the page to bring the user back to the login screen
      CN_session.reload();
      const error = new Error("Session has expired.");
      error.ignore = true; // we're reloading, so don't show the error
      throw error;
    }

    if (
      null != CN_session.data && (
        site_id != CN_session.data.site.id ||
        user_id != CN_session.data.user.id ||
        role_id != CN_session.data.role.id
      )
    ) {
      await (CN_modal_message({
        title: "Login Mismatch",
        size: "lg",
        type: "danger",
        message: `
          <div class="pb-2">
            You have been switched to another site or role in a different browser.
            The application will now reload, switching you to the correct configuration.
          </div>
          <div>
            This should only happen as a result of accessing the application from a different browser window.
            If this message persists then please contact support as someone else may be logged into your account.
          </div>
        `,
      })).open();

      CN_session.reload(true);
      const error = new Error("Session mismatch.");
      error.ignore = true; // we're reloading, so don't show the error
      throw error;
    }

    if (300 <= response.status) {
      const body = await response.text();

      let error = new URIError();
      error.error_code = null;
      error.response = response;
      error.body = body;

      if (306 == response.status && body) {
        error.title = "Please Note";
        error.message = JSON.parse(body);
      } else {
        let message = null;
        if (403 == response.status) {
          error.title = "Permission Denied";
          message = "you do not have access to the requested resource.";
        } else if (404 == response.status) {
          error.title = "Not Found";
          message = "because the needed resource could not be found.";
        } else if (406 == response.status) {
          error.title = "Format Unavailable";
          message = "because the requested format is not available.";
        } else if (409 == response.status) {
          if (CN_common.is_object(options) && "DELETE" == options.method && body) {
            error.title = "Cannot Delete Record",
            message = `because the record is being referenced by the "${JSON.parse(body)}" table.`;
          } else {
            error.title = "Conflict";
            message = "due to a pre-existing conflict.";
          }
        } else {
          error.title = "Server Error";
          message = "due to a server-based error.";
          if (body) error.error_code = JSON.parse(body);
        }

        if (message) {
          error.message = error.message ? `${error.message} ${message}` : CN_common.uc_first(message);
        }
        if (response.status) error.title += ` (${response.status})`;
      }

      throw error;
    }

    return response;
  }

  /**
   * Convenience method for all GET API calls
   * @param strign path: The relative API path
   * @param object params: Query URI parameters
   * @param boolean return_response: Whether to return the fetch response instead of the response's json data
   * @return Response or object or string
   */
  static async get(path, params, return_response = false) {
    const timezone = null != CN_session.data ? CN_session.data.user.timezone : "UTC";
    const response = await this.fetch(
      path,
      params,
      { headers: { "X-No-Activity": true, "X-Timezone": timezone } }
    );

    // return the fetch response if requested
    if (return_response) return response;

    // return the response decoded as JSON if possible
    const body = await response.text();
    try {
      return JSON.parse(body);
    } catch (error) {
      return body;
    }
  }

  /**
   * Convenience method for getting the total number of records available at a query-based path
   * @param string path: The relative API path
   * @param object params: Query URI parameters
   * @return integer
   */
  static async count(path, params) {
    if (CN_common.is_object(params)) {
      params.count = true;
    } else if (CN_common.is_string(params) && 0 < params.length) {
      params += "&count=true";
    } else {
      params = { params: true };
    }

    const response = await this.get(path, params, true);
    return response.headers.get('X-Total');
  }

  /**
   * Convenience method for all PATCH API calls
   * @param strign path: The relative API path
   * @param object data: The data to patch
   * @param boolean raw: Whether to upload the data without stringifying it (for non object data)
   * @param boolean return_response: Whether to return the fetch response instead of the response's json data
   * @return Response or object or string
   */
  static async patch(path, data, raw = false, return_response = false) {
    const timezone = null != CN_session.data ? CN_session.data.user.timezone : "UTC";
    const response = await this.fetch(
      path,
      null,
      {
        method: "PATCH",
        body: raw ? data : JSON.stringify(data),
        headers: { "Content-type": "application/json", "X-Timezone": timezone },
      },
    );

    // return the fetch response if requested
    if (return_response) return response;

    // return the response decoded as JSON if possible
    const body = await response.text();
    try {
      return JSON.parse(body);
    } catch (error) {
      return body;
    }
  }

  /**
   * Convenience method for all POST API calls
   * @param strign path: The relative API path
   * @param object data: The data to post
   * @param boolean raw: Whether to upload the data without stringifying it (for non object data)
   * @param boolean return_response: Whether to return the fetch response instead of the response's json data
   * @return Response or object or string
   */
  static async post(path, data, raw = false, return_response = false) {
    const timezone = null != CN_session.data ? CN_session.data.user.timezone : "UTC";
    const response = await this.fetch(
      path,
      null,
      {
        method: "POST",
        body: raw ? data : JSON.stringify(data),
        headers: { "Content-type": "application/json", "X-Timezone": timezone },
      }
    );

    // return the fetch response if requested
    if (return_response) return response;

    // return the response decoded as JSON if possible
    const body = await response.text();
    try {
      return JSON.parse(body);
    } catch (error) {
      return body;
    }
  }

  /**
   * Convenience method for all DELETE API calls
   * @param strign path: The relative API path
   * @return Response
   */
  static async delete(path) {
    return await this.fetch(path, null, { method: "DELETE" });
  }

  /**
   * Convenience method for getting files from the API
   * @param strign path: The relative API path
   * @param string mime_type: The expected mime type (or file extension)
   * @param object params: Query URI parameters
   * @param boolean return_response: Whether to return the fetch response instead of the response's blob data
   * @return Response or object or string
   */
  static async file(path, mime_type = null, params = {}, return_response = false) {
    const headers = { "X-No-Activity": true };
    if (mime_type) {
      if ("csv" == mime_type) mime_type = "text/csv;charset=utf-8";
      else if ("jpeg" == mime_type) mime_type = "image/jpeg";
      else if ("ods" == mime_type) mime_type = "application/vnd.oasis.opendocument.spreadsheet;charset=utf-8";
      else if ("pdf" == mime_type) mime_type = "application/pdf";
      else if ("png" == mime_type) mime_type = "image/png";
      else if ("txt" == mime_type) mime_type = "text/plain";
      else if ("unknown" == mime_type) mime_type = "application/octet-stream";
      else if ("wav" == mime_type) mime_type = "audio/wav";
      else if ("xlsx" == mime_type) mime_type =
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8";
      else if ("zip" == mime_type) mime_type = "application/zip";

      headers.Accept = mime_type;
    }
    params.download = true;
    const response = await this.fetch(path, params, { headers: headers });

    return return_response ? response : await response.blob();
  }

  /**
   * Converts a select parameter into a stringified query parameter
   *
   * Select objects take the following form:
   * {
   *   from: <table_name>
   *   OR
   *   from:
   *   {
   *     table: <table_name>
   *     alias: <table_alias>
   *   }
   *   column:
   *   [
   *     <column_name>,
   *     {
   *       table: <table_name> (optional)
   *       column: <column_name>
   *       alias: <column_alias> (optional)
   *       table_prefix: true|false (optional)
   *     },
   *   ],
   *   distinct: <true|false>
   * }
   *
   * @param object select
   * @return string
   */
  static select(select) {
    return JSON.stringify(this.shorten_select(select));
  }

  /**
   * Converts a modifier parameter into a stringified query parameter
   *
   * Modifier objects take the following form:
   * {
   *   join:
   *   [
   *     {
   *       table: <table>,
   *       onleft: <column>,
   *       onright: <column>,
   *       type: inner|cross|straight|left|left outer|right|right outer (optional)
   *       alias: <string> (optional),
   *       prepend: true|false (optional)
   *     }
   *   ],
   *   having|where or h|w:
   *   [
   *     {
   *       bracket: true,
   *       open: true|false,
   *       or: true|false
   *     },
   *     {
   *       column: <column>
   *       operator: =|!=|<|>|LIKE|NOT LIKE|etc
   *       value: <value>
   *     }
   *   ],
   *   order:
   *   [
   *     <column>,
   *     { <column>: true|false (whether to sort descending) }
   *   ],
   *   limit: N,
   *   offset or off: N
   * }
   *
   * @param object modifier
   * @return string
   */
  static modifier(modifier) {
    return JSON.stringify(this.shorten_modifier(modifier));
  }

  /**
   * Shortens all select properties
   * @param object select
   * @return object
   */
  static shorten_select(select) {
    if (Array.isArray(select)) {
      return select.map(item => this.shorten_select(item));
    } else if (CN_common.is_object(select)) {
      let new_select = {};
      for (const k in select) {
        if (Object.prototype.hasOwnProperty.call(select, k)) {
          new_select[
            SELECT_SHORT_NAMES[k] ?
            SELECT_SHORT_NAMES[k] :
            k
          ] = this.shorten_select(select[k]);
        }
      }
      return new_select;
    }

    // return non array/objects unchanged
    return select;
  }

  /**
   * Lengthens all select properties
   * @param object select
   * @return object
   */
  static lengthen_select(select) {
    if (Array.isArray(select)) {
      return select.map(item => this.lengthen_select(item));
    } else if (CN_common.is_object(select)) {
      let new_select = {};
      for (const k in select) {
        if (Object.prototype.hasOwnProperty.call(select, k)) {
          new_select[
            SELECT_LONG_NAMES[k] ?
            SELECT_LONG_NAMES[k] :
            k
          ] = this.lengthen_select(select[k]);
        }
      }
      return new_select;
    }

    // return non array/objects unchanged
    return select;
  }

  /**
   * Shortens all modifier properties
   * @param object modifier
   * @return object
   */
  static shorten_modifier(modifier) {
    if (Array.isArray(modifier)) {
      return modifier.map(item => this.shorten_modifier(item));
    } else if (CN_common.is_object(modifier)) {
      let new_modifier = {};
      for (const k in modifier) {
        if (Object.prototype.hasOwnProperty.call(modifier, k)) {
          new_modifier[
            MODIFIER_SHORT_NAMES[k] ?
            MODIFIER_SHORT_NAMES[k] :
            k
          ] = this.shorten_modifier(modifier[k]);
        }
      }
      return new_modifier;
    }

    // return non array/objects unchanged
    return modifier;
  }

  /**
   * Lengthens all modifier properties
   * @param object modifier
   * @return object
   */
  static lengthen_modifier(modifier) {
    if (Array.isArray(modifier)) {
      return modifier.map(item => this.lengthen_modifier(item));
    } else if (CN_common.is_object(modifier)) {
      let new_modifier = {};
      for (const k in modifier) {
        if (Object.prototype.hasOwnProperty.call(modifier, k)) {
          new_modifier[
            MODIFIER_LONG_NAMES[k] ?
            MODIFIER_LONG_NAMES[k] :
            k
          ] = this.lengthen_modifier(modifier[k]);
        }
      }
      return new_modifier;
    }

    // return non array/objects unchanged
    return modifier;
  }
}
