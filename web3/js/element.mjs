// ELEMENT

import CN_api from "./api.mjs"
import CN_common from "./common.mjs"
import CN_session from "./session.mjs"
import CN_timezones from "./timezones.mjs"

/**
 * A list of functions that create various elements
 */
export default {
  /**
   * The DOMParser used by create() when creating elements from HTML strings
   */
  dom_parser: new DOMParser(),

  /**
   * Converts an HTML string into an Element object
   * @param string html: HTML expressed as a string
   * @return Element
   */
  create: function(html) {
    if (undefined === html) throw new Error("element.create: must provide 1 argument, 0 provided");
    if (0 == html.length) throw new Error("element.create: argument cannot be empty");

    return (
      Array.isArray(html) ?
        // return an array of elements
        html.map(str => this.dom_parser.parseFromString(str, "text/html").body.firstChild) :
        // if the first character isn't opening an element then assume it is the element name only
        this.dom_parser.parseFromString(html, "text/html").body.firstChild
    );
  },

  /**
   * Creates a card element containing header, body and footer sub-elements
   * @return Element
   */
  create_card: function() {
    return this.create(`
      <div class="container-fluid mb-2 p-0">
        <div class="card">
          <div class="card-header text-bg-primary fw-bold fs-5"></div>
          <div class="card-body"></div>
          <div class="card-footer text-bg-secondary fs-5"></div>
        </div>
      </div>
    `);
  },

  /**
   * Creates a form label
   * @param object params: An object that has value, for and name properties
   * @return Element
   */
  create_form_label: function(params) {
    const el = this.create(`
      <label class="col-sm-3 col-form-label text-end fw-bold">
        ${params.value}
      </label>
    `);
    if (undefined !== params.for) el.setAttribute("for", params.for);
    if (undefined !== params.name) el.setAttribute("name", params.name);
    return el;
  },

  /**
   * Creates a form element
   * @param string type: One of "boolean", "date", "email", "enum", "integer", "string", "password", "rank", "text", "time", or "typeahead"
   * @param object params: An object defining the element (properties depending on element type)
   * @return Element
   */
  create_form_element: function(type, params) {
    const el = this.create('<div class="col-sm-9"></div>');
    el.params = params;

    let control_el = null;
    if ("boolean" == type) {
      control_el = this.create(`
        <select class="form-select">
          <option value="1">Yes</option>
          <option value="0">No</option>
        </select>
      `);
    } else if (["date", "datetime", "dob", "dod"].includes(type)) {
      // TODO: implement datetime, dob and dod
      if (undefined === el.params.placeholder) el.params.placeholder = "YYYY-MM-DD";

      control_el = this.create(`<input class="form-control"></input>`);
      control_el.onkeyup = () => {
        control_el.value = control_el.value
          .replace(/[^0-9]/g, "")
          .replace(/^([0-9]{4})([0-9]*)/, "$1-$2")
          .replace(/^([0-9]{4}-[0-9]{2})([0-9]*)/, "$1-$2")
          .replace(/^([0-9]{4}-[0-9]{2}-[0-9]{2}).*/, "$1");
      };
    } else if ("email" == type) {
      control_el = this.create(`<input type="email" class="form-control"></input>`);
    } else if ("enum" == type) {
      control_el = this.create(`<select class="form-select"></select>`);
    } else if (["integer", "float"].includes(type)) {
      control_el = this.create(`
        <input
          type="number"
          class="form-control"
          ${null == el.params.min ? "" : "min="+el.params.min}
          ${null == el.params.max ? "" : "max="+el.params.max}
        ></input>
      `);
    } else if ("string" == type) {
      control_el = this.create(`<input class="form-control"></input>`);
    } else if ("password" == type) {
      control_el = this.create(`<input type="password" class="form-control"></input>`);
    } else if ("rank" == type) {
      control_el = this.create(`<select class="form-select"></select>`);
    } else if ("text" == type) {
      control_el = this.create(`
        <textarea
          class="form-control"
          oninput="
            this.style.height = '';
            this.style.height = this.scrollHeight + 'px';
          "
        ></textarea>
      `);
    } else if ("time" == type) {
      if (undefined === el.params.placeholder) el.params.placeholder = "HH:MM";

      control_el = this.create(`<input class="form-control"></input>`);
      control_el.onkeyup = () => {
        control_el.value = control_el.value
          .replace(/[^0-9]/g, "")
          .replace(/^([0-9]{2})([0-9]*)/, "$1:$2")
          .replace(/^([0-9]{2}:[0-9]{2}).*/, "$1");
      };
    } else if ("typeahead" == type) {
      control_el = this.create(`<input class="form-control" autocomplete="off"></input>`);

      if (CN_common.is_object(el.params.typeahead)) {
        if (!el.params.typeahead.hasOwnProperty("min_length")) el.params.typeahead.min_length = 2;
        el.params.typeahead.promise = null;
        el.params.typeahead.timeout_id = null;
        el.params.typeahead.open = false;

        // create the typeahead's element
        const typeahead_el = this.create(`<div class="dropdown"><ul class="dropdown-menu w-100"></ul></div>`);
        const dropdown_bs = new bootstrap.Dropdown(typeahead_el);

        // add the typeahead's element after the prop's element once it's been inserted into the DOM
        const observer = new MutationObserver((mutation, observer) => {
          if (document.contains(control_el)) {
            control_el.after(typeahead_el);
            observer.disconnect();
          }
        });
        observer.observe(el, { childList: true });

        // track whether the dropdown is open or not
        typeahead_el.addEventListener("shown.bs.dropdown", () => { el.params.typeahead.open = true; });
        typeahead_el.addEventListener("hidden.bs.dropdown", () => { el.params.typeahead.open = false; });

        // cancel the typeahead when the escape key is pressed
        control_el.onkeydown = (event) => {
          if ("Escape" == event.key) {
            if (el.params.typeahead.open) {
              if (CN_common.is_function(el.params.typeahead.on_cancel)) {
                el.params.typeahead.on_cancel();
              }
              dropdown_bs.hide()
            }
          }
        };
        control_el.onblur = async () => {
          // we may be blurring after a button click, so give it time to process
          await CN_common.sleep(200);

          if (el.params.typeahead.open) {
            // call on_cancel if the typeahead is open
            if (CN_common.is_function(el.params.typeahead.on_cancel)) {
              el.params.typeahead.on_cancel();
            }
            dropdown_bs.hide();
          } else {
            // return to the last committed value if there's a parent model
            if (el.parent_model && el.params.name) {
              el.parent_model.get_property(el.params.name).state.undo(true);
            }
          }
        }

        // listen for when the input's value has changed
        control_el.addEventListener('input', async () => {
          const typeahead = el.params.typeahead;

          // only proceed if the typeahead isn't loading and we've reached the min length threshold
          if (typeahead.min_length > control_el.value.length) return;

          // wait for the last request to complete
          await typeahead.promise;

          // clear any previous attempt that happened too soon ago
          if (null != typeahead.timeout_id) {
            clearTimeout(typeahead.timeout_id);
            typeahead.timeout_id = null;
          }

          // wait at short while after the user has stopped typing before proceeding
          typeahead.timeout_id = setTimeout(typeahead.promise = async () => {
            typeahead.timeout_id = null;

            // generate the list if the get_list() function exists
            if (CN_common.is_function(typeahead.get_list)) {
              typeahead.list = await typeahead.get_list(control_el.value);
            }

            // convert string values to objects with key and value pairs
            typeahead.list = typeahead.list.map(
              item => CN_common.is_object(item) ? item : { key: item, value: item }
            );

            // now create a list of <li> elements for the typeahead's <ul> element
            // NOTE: it's important to do this before replacing the <ul> children below (based on execute time)
            const li_el_list = typeahead.list
              // Make sure only matching items are included (this is already done in get_list() but not when
              // the list isn't dynamic
              .filter(item => item.value.match(new RegExp(control_el.value, "i")))
              .map(item => {
                const item_el = this.create(`<li><btn class="dropdown-item">${item.value}</btn></li>`)
                item_el.onclick = () => {
                  control_el.value = item.value;
                  if (CN_common.is_function(typeahead.on_select)) typeahead.on_select(item);
                  dropdown_bs.hide();
                }
                return item_el;
              }).slice(0, 20); // only use the first 20 results (to limit the size of the dropdown list)

            // now replace the dropdown's list with the matching items
            const ul_el = typeahead_el.querySelector("ul");
            ul_el.innerHTML = "";
            li_el_list.forEach(item_el => ul_el.append(item_el));
            if (!typeahead.open) dropdown_bs.show();
          }, 200);
        });
      }
    } else {
      throw new Error(`Tried to create form element using a missing or invalid type "${type}".`);
    }

    // create the element's validate function
    el.validate = () => {
      // determine if there was an error
      let error = null;

      if (el.params.required && [null, ""].includes(control_el.value)) {
        error = "Can't be empty";
      } else if (
        "email" == type &&
        !control_el.value.match(/^(([a-zA-Z0-9]+)|([a-zA-Z0-9]+((?:_[a-zA-Z0-9]+)|(?:\.[a-zA-Z0-9]+))*))(@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-zA-Z]{2,6}(?:\.[a-zA-Z]{2})?)$)/)
      ) {
        error = `${control_el.value} is not a valid email address`;
      } else if (
        ["integer", "float"].includes(type) &&
        null != el.params.min && control_el.value < el.params.min
      ) {
        error = `The smallest number allowed is ${el.params.min}`;
      } else if (
        ["integer", "float"].includes(type) &&
        null != el.params.max && control_el.value > el.params.max
      ) {
        error = `The biggest number allowed is ${el.params.max}`;
      } else if (
        "time" == type &&
        0 < control_el.value.length &&
        !control_el.value.match(/^(2[0-3]|[01]?[0-9]):([0-5]?[0-9])$/)
      ) {
        error = `${control_el.value} is not a valid time`;
      }

      if (null == error && el.params.format) {
        // determine the regex
        let re = null;
        if ("integer" == el.params.format) re = /^-?[0-9]+$/;
        else if ("float" == el.params.format) re = /^-?(([0-9]+\.?)|([0-9]*\.[0-9]+))$/;
        else if ("alphanum" == el.params.format) re = /^[a-zA-Z0-9]+$/;
        else if ("alpha_num" == el.params.format) re = /^[a-zA-Z0-9_]+$/;
        else if ("identifier" == el.params.format) re = /^[^;=\/]+$/;

        // test the regex, min and max values
        if (re && !re.test(control_el.value)) {
          error = "Invalid format";
        }
      }

      if (null == error && el.params.regex) {
        var regex_list = CN_common.is_array(el.params.regex) ? el.params.regex : [el.params.regex];
        for (var i = 0; i < regex_list.length; i++) {
          var re = new RegExp(regex_list[i]);
          if (!re.test(control_el.value)) {
            error = "Invalid format";
            break;
          }
        }
      }

      // show any errors
      if (null != error) el.show_error(error, 2000);

      return null == error;
    };

    // add an onchange function to all properties except typeaheads (they use on_select instead)
    if ("typeahead" != type && !CN_common.is_function(control_el.onchange)) {
      control_el.onchange = async () => {
        if (["date", "time"].includes(type)) {
          control_el.onkeyup();
        } else if (["integer", "float"].includes(type)) {
          control_el.value = "integer" == type ? parseInt(control_el.value) : parseFloat(control_el.value);
        }

        // validate the input
        const valid = el.validate();

        // call the onchange function if it exists
        if (CN_common.is_function(el.params.onchange)) {
          await el.params.onchange(control_el, valid, el.parent_model);
        }
      };
    }

    if (CN_common.is_object(el.params.action)) {
      // add an action button in-line with the control element
      const action_el = this.create(`
        <div class="row">
          <div name="control" class="col-9"></div>
          <div name="action" class="col-3"></div>
        </div>
      `);
      action_el.querySelector("[name=control]").append(control_el);
      const action_btn_el = this.create(`
        <button
          type="button"
          class="w-100 btn ${el.params.action.class ? el.params.action.class : 'btn-outline-primary'}"
        >${el.params.action.title}</button>
      `);
      action_btn_el.onclick = el.params.action.onclick;
      action_el.querySelector("[name=action]").append(action_btn_el);
      el.append(action_el);
    } else {
      el.append(control_el);
    }

    if (undefined !== el.params.id) control_el.setAttribute("id", el.params.id);
    if (undefined !== el.params.name) control_el.setAttribute("name", el.params.name);
    if (undefined !== el.params.title) control_el.setAttribute("aria-label", el.params.title);
    if (undefined !== el.params.placeholder) control_el.setAttribute("placeholder", el.params.placeholder);
    if (undefined !== el.params.max_length) control_el.setAttribute("max_length", el.params.max_length);
    if (['boolean', 'enum'].includes(type)) {
      if (!el.params.required) {
        let empty = undefined === el.params.placeholder ? "(empty)" : el.params.placeholder;
        control_el.prepend(this.create(`<option value="">${empty}</option>`));
      }
    } else {
      if (el.params.placeholder) control_el.placeholder = el.params.placeholder;
      if (el.params.required) control_el.setAttribute("required", "required");
    }

    el.show_error = async function(error, time = 300) {
      const control_el = document.getElementById(this.params.id);
      const error_el = this.querySelector('[name="error"]');

      Object.assign(control_el.style, {
        "border-color": "red",
        "border-width": "3px",
        margin: "-2px",
      });

      if (error) error_el.innerHTML = error;

      if (0 < time) {
        await CN_common.sleep(time);
        this.hide_error();
      }
    };

    el.hide_error = function() {
      const control_el = document.getElementById(this.params.id);
      const error_el = this.querySelector('[name="error"]');

      control_el.style.removeProperty("border-color");
      control_el.style.removeProperty("border-width");
      control_el.style.removeProperty("margin");
      error_el.innerHTML = "";
    };

    el.append(this.create('<small name="error" class="text-danger"></small>'));

    return el;
  },

  /**
   * Creates a breadcrumb trail based on a module list
   * @param array module_list: A list of modules in their trail order
   * @return Element
   */
  create_breadcrumb_trail: async function(base_name, module_list) {
    // create a list of all crumbs (adding chevrons later)
    let crumb_list = [];

    if (null == base_name) {
      const unread = 0 == CN_session.system_message_list.filter(message => message.unread).length;
      crumb_list = [{
        name: unread ? "Home" : 'Home <i class="bi-envelope-fill text-warning"></i>',
        path: ""
      }];
    } else {
      crumb_list.push({ name: base_name, path: null });
    }

    let parent_module = null;
    await Promise.all(module_list.map(async module_name => {
      if ("error" == module_name) {
        crumb_list.push({ name: "Error", path: null });
      } else {
        const module = CN_session.get_module(module_name);
        const action_name = module.get_action_name();
        const model = module.get_model();
        if ("add" == action_name) {
          crumb_list.push({
            name: `Add ${CN_common.uc_words(model.get_singular())}`,
            path: null,
          });
        } else if ("view" == action_name) {
          const crumb = {
            name: "...",
            path: model.get_view_url(),
          };
          crumb_list.push(crumb);

          // get the name after we've added the crumb to the list, otherwise it may be out of order
          crumb.name = await model.get_action().get_text("name");
        } else if ("list" == action_name) {
          crumb_list.push({
            name: CN_common.uc_words(model.get_plural()),
            path: null == parent_module ? `${module_name}/list` : parent_model.get_view_url(),
          });
        }
        parent_module = module;
      }
    }));

    // add each crumb to the trail, interspersed by chevrons
    const root_el = this.create('<div></div>');
    let last_crumb_el = null;
    crumb_list.forEach(crumb => {
      root_el.append(this.create('<i class="bi-chevron-compact-right text-light"></i>'));
      let crumb_el = this.create(`
        <button
          class="btn btn-primary px-1"
          data-bs-dismiss="offcanvas"
          data-bs-target="#main-menu-offcanvas"
        >${crumb.name}</button>
      `);
      last_crumb_el = crumb_el;
      root_el.append(crumb_el);
      if (null == crumb.path) {
        crumb_el.setAttribute("disabled", true);
      } else {
        crumb_el.onclick = () => CN_session.navigate_to(crumb.path);
      }
    });

    // the last crumb shuold always be disabled
    if (last_crumb_el) last_crumb_el.setAttribute("disabled", true);

    return root_el;
  },

  /**
   * Creates a clock settings modal (for changing the user's time-based preferences)
   * @return bootstrap.Modal
   */
  create_clock_settings_modal: function() {
    const modal_el = this.create(`
      <div id="cn_clock_settings_modal" class="modal fade" tabindex="-1">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header text-bg-primary">
              <h2 class="modal-title fw-bold fs-5">Clock Settings</h2>
            </div>
            <div class="modal-body">
              <span class="text-secondary">
                Select which timezone you would like times to be displayed in.<br />
                Note that most timezones have multiple names, you may choose any.
              </span>
              <hr />
              <form></form>
            </div>
            <div class="modal-footer text-bg-secondary">
              <button type="button" class="btn btn-light" data-bs-dismiss="modal">Cancel</button>
              <button name="save" type="button" class="btn btn-primary">Save</button>
            </div>
          </div>
        </div>
      </div>
    `);

    document.getElementById("main-content").append(modal_el);
    const form_el = modal_el.querySelector("form");
    const modal_bs = new bootstrap.Modal(modal_el, { keyboard: false });

    // automatically dispose of the modal once finished
    modal_el.addEventListener("hidden.bs.modal", () => {
      modal_bs.dispose();
      modal_el.remove();
    });

    // used below
    const save_btn_el = modal_el.querySelector("[name=save]");

    // add a timezone typeahead property
    const timezone_el = this.create('<div class="row mb-3"></div>');
    form_el.append(timezone_el);
    timezone_el.append(this.create_form_label({
      for: "csm_timezone",
      value: "Timezone"
    }));
    timezone_el.append(this.create_form_element("typeahead", {
      id: "cn_clock_settings_modal_timezone",
      required: true,
      typeahead: {
        list: CN_timezones,
        on_select: (el) => {
          const timezone_control_el = document.getElementById("cn_clock_settings_modal_timezone");
          timezone_control_el.value = el.value;
          timezone_control_el.last_selected_value = el.value;
        },
        on_cancel: () => {
          const timezone_control_el = document.getElementById("cn_clock_settings_modal_timezone");
          timezone_control_el.value = timezone_control_el.last_selected_value;
        },
      },
      onchange: (control_el, valid, model) => {
        if (valid) {
          save_btn_el.removeAttribute("disabled");
        } else {
          save_btn_el.setAttribute("disabled", "disabled");
        }
      },
    }));
    const timezone_control_el = document.getElementById("cn_clock_settings_modal_timezone");
    timezone_control_el.value = CN_session.data.user.timezone;
    timezone_control_el.last_selected_value = CN_session.data.user.timezone;
    timezone_control_el.onblur = () => {
      if (!CN_timezones.includes(timezone_control_el.value)) {
        timezone_control_el.value = timezone_control_el.last_selected_value;
      }
    }

    // add a use 12-hour clock boolean property
    const am_pm_el = this.create('<div class="row mb-3"></div>');
    am_pm_el.append(this.create_form_label({ for: "cn_clock_settings_modal_am_pm", value: "Use 12-Hour Clock" }));
    am_pm_el.append(this.create_form_element("boolean", { id: "cn_clock_settings_modal_am_pm", required: true }));
    form_el.append(am_pm_el);
    document.getElementById("cn_clock_settings_modal_am_pm").value = CN_session.data.user.am_pm ? 1 : 0;

    save_btn_el.onclick = async () => {
      let timezone = timezone_control_el.last_selected_value;
      let am_pm = 1 == document.getElementById("cn_clock_settings_modal_am_pm").value;
      if (CN_session.data.user.timezone != timezone || CN_session.data.user.am_pm != am_pm) {
        // hide the modal so we only see the wait message
        modal_bs.hide();

        await this.wait_for(async () => {
          // update the user then reload the UI so all datetimes are adjusted
          await CN_api.patch( "self/0", { user: { timezone: timezone, use_12hour_clock: am_pm }});
          CN_session.reload();
        });
      }
      modal_bs.hide();
    };

    return modal_bs;
  },

  /**
   * Creates an account modal (for changing the user's account details)
   * @return bootstrap.Modal
   */
  create_account_modal: function() {
    const modal_el = this.create(`
      <div id="cn_account_modal" class="modal fade" tabindex="-1">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header text-bg-primary">
              <h2 class="modal-title fw-bold fs-5">Account Details</h2>
            </div>
            <div class="modal-body">
              <span class="text-secondary">
                Update your account details here:
              </span>
              <hr />
              <form></form>
            </div>
            <div class="modal-footer text-bg-secondary">
              <button type="button" class="btn btn-light" data-bs-dismiss="modal">Cancel</button>
              <button name="save" type="button" class="btn btn-primary">Save</button>
            </div>
          </div>
        </div>
      </div>
    `);

    document.getElementById("main-content").append(modal_el);
    const form_el = modal_el.querySelector("form");
    const modal_bs = new bootstrap.Modal(modal_el, { keyboard: false });

    // automatically dispose of the modal once finished
    modal_el.addEventListener("hidden.bs.modal", () => {
      modal_bs.dispose();
      modal_el.remove();
    });

    // used below
    const save_btn_el = modal_el.querySelector("[name=save]");
    const onchange_fn = (control_el, valid, model) => {
      if (valid) {
        save_btn_el.removeAttribute("disabled");
      } else {
        save_btn_el.setAttribute("disabled", "disabled");
      }
    };

    // create elements
    let element_list = [
      { id: "first_name", title: "First Name", type: "string", },
      { id: "last_name", title: "Last Name", type: "string" },
      { id: "email", title: "Email", type: "email" },
    ];

    element_list.forEach(element => {
      let id = `cn_account_modal_${element.id}`;
      const el = this.create('<div class="row mb-3"></div>');
      el.append(this.create_form_label({ for: id, value: element.title }));
      el.append(this.create_form_element(element.type, { id: id, required: true, onchange: onchange_fn }));
      form_el.append(el);
      document.getElementById(id).value = CN_session.data.user[element.id];
    });

    save_btn_el.onclick = async () => {
      let first_name = document.getElementById("cn_account_modal_first_name").value;
      let last_name = document.getElementById("cn_account_modal_last_name").value;
      let email = document.getElementById("cn_account_modal_email").value;
      if (
        CN_session.data.user.first_name != first_name ||
        CN_session.data.user.last_name != last_name ||
        CN_session.data.user.email != email
      ) {
        // update the server
        await CN_api.patch("self/0", {
          user: {
            first_name: first_name,
            last_name: last_name,
            email: email,
          },
        });

        // update the UI
        CN_session.data.user.first_name = first_name;
        CN_session.data.user.last_name = last_name;
        CN_session.data.user.email = email;
      }
      modal_bs.hide();
    };

    return modal_bs;
  },

  /**
   * Creates a password modal (for changing the user's password)
   * @return bootstrap.Modal
   */
  create_password_modal: function() {
    const modal_el = this.create(`
      <div id="cn_password_modal" class="modal fade" tabindex="-1">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header text-bg-primary">
              <h2 class="modal-title fw-bold fs-5">Account Details</h2>
            </div>
            <div class="modal-body">
              <div class="text-secondary">
                Fill out this form to change your password.
              </div>
              <div class="text-warning">
                Note that passwords must be at least 8 characters long.
              </div>
              <hr />
              <form></form>
            </div>
            <div class="modal-footer text-bg-secondary">
              <button type="button" class="btn btn-light" data-bs-dismiss="modal">Cancel</button>
              <button name="save" type="button" class="btn btn-primary" disabled>Save</button>
            </div>
          </div>
        </div>
      </div>
    `);

    document.getElementById("main-content").append(modal_el);
    const form_el = modal_el.querySelector("form");
    const save_btn_el = modal_el.querySelector("[name=save]");
    const modal_bs = new bootstrap.Modal(modal_el, { keyboard: false });

    // automatically dispose of the modal once finished
    modal_el.addEventListener("hidden.bs.modal", () => {
      modal_bs.dispose();
      modal_el.remove();
    });

    // create elements
    let element_list = [
      { id: "current_password", title: "Current Password" },
      { id: "new_password", title: "New Password" },
      { id: "new_password_check", title: "Repeat New Password" },
    ];

    element_list.forEach(element => {
      let id = `cn_password_modal_${element.id}`;
      const el = this.create('<div class="row mb-3"></div>');
      el.append(this.create_form_label({ for: id, value: element.title }));
      el.append(this.create_form_element("password", { id: id, required: true }));
      form_el.append(el);

      // widen all labels
      el.children[0].classList.replace("col-sm-3", "col-sm-4");
      el.children[1].classList.replace("col-sm-9", "col-sm-8");
    });

    // track when the save button should be enabled
    const current_password_control_el = document.getElementById("cn_password_modal_current_password");
    const new_password_control_el = document.getElementById("cn_password_modal_new_password");
    const new_password_control_check_el = document.getElementById("cn_password_modal_new_password_check");

    const update_save_btn = () => {
      if (
        0 < current_password_control_el.value.length &&
        8 <= new_password_control_el.value.length &&
        8 <= new_password_control_check_el.value.length
      ) {
        save_btn_el.removeAttribute("disabled");
      } else {
        save_btn_el.setAttribute("disabled", "disabled");
      }
    };

    current_password_control_el.onkeyup = update_save_btn;
    new_password_control_el.onkeyup = update_save_btn;
    new_password_control_check_el.onkeyup = update_save_btn;

    save_btn_el.onclick = async () => {
      let current_password = current_password_control_el.value;
      let new_password = new_password_control_el.value;
      let new_password_check = new_password_control_check_el.value;

      if (new_password !== new_password_check) {
        this.toast({
          title: "Password Mismatch",
          message: "The new passwords do not match.  Please type them again and make sure they are the same.",
          type: "danger",
        });
      } else {
        // update the server
        try {
          await CN_api.patch("self/0", {
            user: {
              password: {
                current: current_password,
                requested: new_password,
              },
            },
          });
        } catch (error) {
          if (CN_common.is_object(error) && "invalid password" == error.error_code) {
            this.toast({
              title: "Password Failed",
              message: "The password you provided as your current password is incorrect.",
              type: "danger",
            });
          } else {
            throw error;
          }
        }

        modal_bs.hide();
      }
    };

    return modal_bs;
  },

  /**
   * Shows a toast message
   * @param object config:
   *   type: Which bootstrap color type to make the header (default light)
   *   title: The toast's title
   *   message: The toast's message
   */
  toast: function(config) {
    if (!config.type) config.type = "light";
    const toast_el = this.create(`
      <div role="alert" aria-live="assertive" aria-atomic="true" class="toast bg-light mb-2">
        <div name="header" class="toast-header text-bg-${config.type}">
          <div class="fw-bold fs-5">${config.title}</div>
          <button
            type="button"
            class="btn-close btn-close-white"
            data-bs-dismiss="toast"
            aria-label="Close"
          ></button>
        </div>
      </div>
    `);

    if (config.message) {
      toast_el.append(this.create(`<div name="body" class="toast-body">${config.message}</div>`));
    }

    document.querySelector("#main-toast-container .toast-container").append(toast_el);
    const toast_bs = new bootstrap.Toast(toast_el);

    // automatically dispose of the toast once finished
    toast_el.addEventListener("hidden.bs.toast", () => {
      toast_bs.dispose();
      toast_el.remove();
    });

    toast_bs.show();
  },

  /**
   * Creates a "please wait" blocking modal
   * @return bootstrap.Modal
   */
  wait_for: async function(fn, delay = 500) {
    const modal_el = this.create(`
      <div class="modal fade" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header text-bg-primary">
              <h1 class="modal-title fw-bold fs-5">Please Wait...</h1>
            </div>
            <div class="modal-body text-center">
              <img src="${CENOZO_URL}/img/loading.gif"></img>
            </div>
          </div>
        </div>
      </div>
    `);
    document.getElementById("main-content").append(modal_el);
    modal_el.setAttribute("data-bs-backdrop", "static");
    modal_el.setAttribute("data-bs-keyboard", "false");

    const modal_bs = new bootstrap.Modal(modal_el);

    // wait for delay before showing the modal
    let timeout_id = setTimeout(() => {
      // automatically dispose of the modal once finished
      modal_el.addEventListener("hidden.bs.modal", () => {
        modal_bs.dispose();
        modal_el.remove();
      });

      modal_bs.show();
      timeout_id = null;
    }, delay);

    try {
      // run the provided function
      await fn();
    } finally {
      if (null != timeout_id) {
        // if the timeout exists then the modal hasn't been shown, so just cancel it
        clearTimeout(timeout_id);
      } else {
        // if the timeout no longer exists then the modal is showing, so hide it
        modal_bs.hide();
      }
    }
  },

  /**
   * Creates a modal message dialog
   * @param object config: An object that has type, title, message and static properties
   * @return bootstrap.Modal
   */
  message_modal: function(config) {
    if (!config.type) config.type = "primary";
    const modal_el = this.create(`
      <div class="modal fade" tabindex="-1">
        <div class="modal-dialog ${config.size ? 'modal-'+config.size : ''}">
          <div class="modal-content">
            <div class="modal-header text-bg-${config.type}">
              <h1 class="modal-title fw-bold fs-5">${config.title}</h1>
              <button
                name="close"
                type="button"
                class="btn-close btn-close-white"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div class="modal-body">${config.message}</div>
          </div>
        </div>
      </div>
    `);
    document.getElementById("main-content").append(modal_el);
    if (config.static) {
      modal_el.setAttribute("data-bs-backdrop", "static");
      modal_el.setAttribute("data-bs-keyboard", "false");
    }

    const modal_bs = new bootstrap.Modal(modal_el);
    modal_bs.block = () => {
      return new Promise((resolve, reject) => {
        modal_bs.show();
        modal_el.querySelector("[name=close]").onclick = () => resolve(true);
      });
    };

    // automatically dispose of the modal once finished
    modal_el.addEventListener("hidden.bs.modal", () => {
      modal_bs.dispose();
      modal_el.remove();
    });

    return modal_bs;
  },

  /**
   * Creates a modal confirm dialog
   * @param object config: An object that has type, title, message and static properties
   * @return bootstrap.Modal
   */
  confirm_modal: function(config) {
    if (!config.type) config.type = "primary";
    if (!config.title) config.title = "Please Confirm";
    const modal_el = this.create(`
      <div class="modal fade" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header text-bg-${config.type}">
              <h1 class="modal-title fw-bold fs-5">${config.title}</h1>
            </div>
            <div class="modal-body">${config.message}</div>
            <div class="modal-footer text-bg-secondary py-1">
              <button
                name="no"
                type="button"
                class="btn btn-primary col-2"
                data-bs-dismiss="modal"
              >No</button>
              <button
                name="yes"
                type="button"
                class="btn btn-primary col-2"
                data-bs-dismiss="modal"
              >Yes</button>
            </div>
          </div>
        </div>
      </div>
    `);
    document.getElementById("main-content").append(modal_el);
    if (config.static) {
      modal_el.setAttribute("data-bs-backdrop", "static");
      modal_el.setAttribute("data-bs-keyboard", "false");
    }

    const modal_bs = new bootstrap.Modal(modal_el);
    modal_bs.test = () => {
      return new Promise((resolve, reject) => {
        modal_bs.show();
        modal_el.querySelector("[name=no]").onclick = () => resolve(false);
        modal_el.querySelector("[name=yes]").onclick = () => resolve(true);
      });
    };

    // automatically dispose of the modal once finished
    modal_el.addEventListener("hidden.bs.modal", () => {
      modal_bs.dispose();
      modal_el.remove();
    });

    return modal_bs;
  },

  /**
   * Creates a modal input dialog
   * @param object config: An object that has type, title, message, type, required, and static properties
   * @return bootstrap.Modal
   */
  input_modal: function(config) {
    if (!config.type) config.type = "primary";
    if (!config.title) config.title = "Please Provide Input";
    const modal_el = this.create(`
      <div class="modal fade" tabindex="-1">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header text-bg-${config.type}">
              <h1 class="modal-title fw-bold fs-5">${config.title}</h1>
            </div>
            <div class="modal-body">
              <label class="form-label" for="cn_input_modal">
                ${config.message}
              </label>
            </div>
            <div class="modal-footer text-bg-secondary py-1">
              <button
                name="cancel"
                type="button"
                class="btn btn-primary col-2"
                data-bs-dismiss="modal"
              >Cancel</button>
              <button
                name="confirm"
                type="button"
                class="btn btn-primary col-2"
              >Confirm</button>
            </div>
          </div>
        </div>
      </div>
    `);

    const input_el = this.create_form_element(config.input, { id: "cn_input_modal", required: config.required });
    input_el.classList.remove("col-sm-9");
    modal_el.querySelector(".modal-body").append(input_el);

    document.getElementById("main-content").append(modal_el);
    if (config.static) {
      modal_el.setAttribute("data-bs-backdrop", "static");
      modal_el.setAttribute("data-bs-keyboard", "false");
    }
    const control_el = document.getElementById("cn_input_modal");

    const modal_bs = new bootstrap.Modal(modal_el);
    modal_bs.get = () => {
      return new Promise((resolve, reject) => {
        modal_bs.show();
        modal_el.querySelector("[name=cancel]").onclick = () => resolve(undefined);
        modal_el.querySelector("[name=confirm]").onclick = () => {
          // only proceed if the input isn't required or it has been filled out
          if (!config.required || ![null, ""].includes(control_el.value)) {
            resolve(control_el.value);
            modal_bs.hide();
          } else {
            control_el.onchange();
          }
        }
      });
    };

    // automatically dispose of the modal once finished
    modal_el.addEventListener("hidden.bs.modal", () => {
      modal_bs.dispose();
      modal_el.remove();
    });

    return modal_bs;
  },

  /**
   * Pops up an input dialog to get the reason why a participant will be added to or removed from tracing
   * as a result of adding/activating or removing/deactivating either an address or phone number.
   * Note that this function should be called before making the change to the address or phone.
   *
   * If tracing is unaffected true is returned, if tracing is affected but no reason is provided then false
   * is returned, otherwise the reason is returned as a string.
   *
   * @param string type: either "address" or "phone"
   * @param boolean action: either "added" or "removed"
   * @param string subject: either "participant" or "alternate"
   * @param integer identifier: an object with identifer (id) and subject (participant or alternate) properties
   * @param boolean|string True if no tracing is required, false if cancelled, a string if a reason is provided
   * @return boolean|string
   */
  check_for_trace: async function(type, action, identifier) {
    // sanitize inputs
    if (!["address", "phone"].includes(type)) {
      throw new Error(`First argument for check_for_trace, "${type}", must be either "address" or "phone".`);
    }
    if (!["added", "removed"].includes(action)) {
      throw new Error(`First argument for check_for_trace, "${action}", must be either "added" or "removed".`);
    }

    // Activate tracing if the contact belongs to a participant who only has one valid contact of the
    // requested type (address or phone) and the last trace is null
    let changing_count_column = `active_${type}_count`;
    let other_count_column = `active_${"address" == type ? "phone" : "address"}_count`;

    const response = await CN_api.get(`participant/${identifier}`, {
      select: {
        column: [
          "active_address_count",
          "active_phone_count",
          { table: "trace_type", column: "name", alias: "trace_type" },
        ],
      },
    });
    let data = await response.json();

    let result = true;
    if ("removed" == action) {
      // check to see if tracing will be required after removing/deactivating the contact type
      if (1 == data[changing_count_column] && null == data.trace_type) {
        result = await this.input_modal({
          title: "Tracing Required",
          message: `
            If you proceed the participant will no longer have an active ${type}.
            In order to help with tracing, please provide the reason that you are changing the participant's ${type}:
          `,
          required: true,
          input: "string",
        }).get();
      }
    } else {
      // check to see if tracing will be resolved after adding/activating the contact type
      if (0 == data[changing_count_column] && 0 < data[other_count_column] && null != data.trace_type) {
        result = await this.input_modal({
          title: "Tracing Completed",
          message: `
            Before your change the participant did not have an active ${type}.
            Please provide how the new ${type} information was determined:
          `,
          required: true,
          input: "string",
        }).get();
      }
    }

    // if the input_modal was cancelled then the value will be undefined
    return undefined === result ? false : result;
  },

}
