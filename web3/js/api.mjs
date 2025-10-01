import CN_common from "./common.mjs"
import CN_element from "./element.mjs"
import CN_session from "./session.mjs"

/**
 * The API class provides a way to communicate with the server's API
 *
 * Fetch methods (get/patch/post/delete) automatically prepend the API's path so only reletive paths must
 * be provided.  These methods also automatically format select and modifier objects and handle various
 * response codes returned by the API.
 */
export default {
  /**
   * Fetch method used for all API calls, returns the result from calling the native fetch() function
   * @param strign path: The relative API path
   * @param object params: Query URI parameters
   * @param object options: Fetch options passed directly to the native fetch() function
   * @return Response
   */
  fetch: async function(path, params, options) {
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
    ){
      await CN_element.message_modal({
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
      }).block();

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
  },

  /**
   * Convenience method for all GET API calls
   * @param strign path: The relative API path
   * @param object params: Query URI parameters
   * @param boolean return_response: Whether to return the fetch response instead of the response's json data
   * @return Response
   */
  get: async function(path, params, return_response = false) {
    const response = await this.fetch(path, params, { headers: { "X-No-Activity": true } });
    return return_response ? response : await response.json();
  },

  /**
   * Convenience method for getting the total number of records available at a query-based path
   * @param string path: The relative API path
   * @param object params: Query URI parameters
   * @return integer
   */
  count: async function(path, params) {
    if (CN_common.is_object(params)) {
      params.count = true;
    } else if (CN_common.is_string(params) && 0 < params.length) {
      params += "&count=true";
    } else {
      params = { params: true };
    }

    const response = await this.get(path, params, true);
    return response.headers.get('X-Total');
  },

  /**
   * Convenience method for all PATCH API calls
   * @param strign path: The relative API path
   * @param object data: The data to patch
   * @return Response
   */
  patch: async function(path, data) {
    return await this.fetch(
      path,
      null,
      {
        method: "PATCH",
        body: JSON.stringify(data),
        headers: { "Content-type": "application/json" },
      },
    );
  },

  /**
   * Convenience method for all POST API calls
   * @param strign path: The relative API path
   * @param object data: The data to post
   * @return Response
   */
  post: async function(path, data) {
    const response = await this.fetch(
      path,
      null,
      {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-type": "application/json" },
      }
    );

    return await response.text();
  },

  /**
   * Convenience method for all DELETE API calls
   * @param strign path: The relative API path
   * @return Response
   */
  delete: async function(path) {
    return await this.fetch(path, null, { method: "DELETE" });
  },

  /**
   * Convenience method for getting files from the API
   * @param strign path: The relative API path
   * @param string mime_type: The expected mime type
   * @param object params: Query URI parameters
   * @param boolean return_response: Whether to return the fetch response instead of the response's blob data
   * @return Response
   */
  file: async function(path, mime_type = null, params = {}, return_response = false) {
    const headers = { "X-No-Activity": true };
    if (mime_type) headers.Accept = mime_type;
    params.download = true;
    const response = await this.fetch(path, params, { headers: headers });

    return return_response ? response : await response.blob();
  },

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
  select: function(select) {
    return JSON.stringify(this.shorten_select(select));
  },

  /**
   * Shortens all select properties
   * @param object select
   * @return object
   */
  shorten_select: function(select) {
    if (Array.isArray(select)) {
      return select.map( item => this.shorten_select(item) );
    } else if (CN_common.is_object(select)) {
      let new_select = {};
      for (var key in select) {
        if (Object.prototype.hasOwnProperty.call(select, key)) {
          const value = this.shorten_select(select[key]);
          if ('alias' == key) key = 'a';
          else if ('column' == key) key = 'c';
          else if ('distinct' == key) key = 'd';
          else if ('from' == key) key = 'f';
          else if ('table_prefix' == key) key = 'p';
          else if ('table' == key) key = 't';
          new_select[key] = value;
        }
      }
      return new_select;
    }

    // return non array/objects unchanged
    return select;
  },

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
  modifier: function(modifier) {
    return JSON.stringify(this.shorten_modifier(modifier));
  },

  /**
   * Shortens all modifier properties
   * @param object modifier
   * @return object
   */
  shorten_modifier: function(modifier) {
    if (Array.isArray(modifier)) {
      return modifier.map( item => this.shorten_modifier(item) );
    } else if (CN_common.is_object(modifier)) {
      let new_modifier = {};
      for (var key in modifier) {
        if (Object.prototype.hasOwnProperty.call(modifier, key)) {
          const value = this.shorten_modifier(modifier[key]);
          if ('alias' == key) key = 'a';
          else if ('bracket' == key) key = 'b';
          else if ('column' == key) key = 'c';
          else if ('having' == key) key = 'h';
          else if ('join' == key) key = 'j';
          else if ('limit' == key) key = 'l';
          else if ('open' == key) key = 'n';
          else if ('order' == key) key = 'o';
          else if ('offset' == key) key = 'off';
          else if ('onleft' == key) key = 'onl';
          else if ('operator' == key) key = 'op';
          else if ('onright' == key) key = 'onr';
          else if ('prepend' == key) key = 'p';
          else if ('table' == key) key = 't';
          else if ('type' == key) key = 'tp';
          else if ('value' == key) key = 'v';
          else if ('where' == key) key = 'w';
          new_modifier[key] = value;
        }
      }
      return new_modifier;
    }

    // return non array/objects unchanged
    return modifier;
  },
}
