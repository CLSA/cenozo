import CN_api from "./api.mjs"
import CN_common from "./common.mjs"
import CN_session from "./session.mjs"
import CN_timezones from "./timezones.mjs"
import CN_datetime_modal, { DATE_TYPES } from "./date/datetime_modal.mjs"

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
  create: function (html) {
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
   * Converts an HTML string into a DocumentFragment object
   * @param string html: HTML expressed as a string
   * @return DocumentFragment
   */
  create_fragment: function (html) {
    if (html == null) throw new Error("element.create_fragment: must provide 1 argument, 0 provided");
    if (0 == html.length) throw new Error("element.create: argument cannot be empty");

    const template = document.createElement('template');
    template.innerHTML = html.trim(); // Use trim() to handle leading/trailing whitespace
    return template.content.firstElementChild;
  },

  /**
   * Creates a card element containing header, body and footer sub-elements
   * @return Element
   */
  create_card: function (child_elements = {}) {
    const el = this.create(`
      <div class="container-fluid mb-2 p-0">
        <div class="card">
          <div class="card-header text-bg-primary fw-bold fs-5"></div>
          <div class="card-body"></div>
          <div class="card-footer text-bg-secondary fs-5"></div>
        </div>
      </div>
    `);

    if (undefined !== child_elements.header) {
      const header_el = el.querySelector(".card-header");
      if (CN_common.is_string(child_elements.header)) {
        header_el.innerHTML = child_elements.header;
      } else if (CN_common.is_element(child_elements.header)) {
        header_el.append(child_elements.header);
      } else if (!child_elements.header) {
        header_el.remove();
      }
    }

    if (undefined !== child_elements.body) {
      const body_el = el.querySelector(".card-body");
      if (CN_common.is_string(child_elements.body)) {
        body_el.innerHTML = child_elements.body;
      } else if (CN_common.is_element(child_elements.body)) {
        body_el.append(child_elements.body);
      } else if (!child_elements.body) {
        body_el.remove();
      }
    }

    if (undefined !== child_elements.footer) {
      const footer_el = el.querySelector(".card-footer");
      if (CN_common.is_string(child_elements.footer)) {
        footer_el.innerHTML = child_elements.footer;
      } else if (CN_common.is_element(child_elements.footer)) {
        footer_el.append(child_elements.footer);
      } else if (!child_elements.footer) {
        footer_el.remove();
      }
    }

    return el;
  },

  /**
   * Creates a large loading box
   * @return Element
   */
  create_loading_box: function (text = null) {
    if (null == text) text = "Loading...";
    return this.create(`
      <div class="container-fluid loading text-primary text-center fs-5 fw-bold" style="height: 9em;">
       ${text}
      </div>
    `);
  },

  /**
   * Creates a form label
   * @param object params: An object that has value, for and name properties
   * @return Element
   */
  create_form_label: function (params) {
    const el = this.create(`<label class="col-form-label text-end fw-bold">${params.value}</label>`);
    if (undefined !== params.for) el.setAttribute("for", params.for);
    if (undefined !== params.name) el.setAttribute("name", params.name);
    if (params.help) {
      el.innerHTML = `<i class="bi-info-circle-fill"></i> ${el.innerHTML}`;
      el.setAttribute("data-bs-toggle", "tooltip");
      el.setAttribute("data-bs-title", params.help);
      new bootstrap.Tooltip(el);
    }
    return el;
  },

  /**
   * Creates a form element
   * @param string type: One of the following:
   *   "audio_url", "boolean", "color", "date", "datetime", "datetimesecond", "dob", "dod", "email", "enum",
   *   "file", "float", "html", "integer", "password", "rank", "size", "string", "text", "time", or "typeahead"
   * @param object params: An object defining the element (properties depending on element type)
   * @return Element
   */
  create_form_element: function (type, params) {
    const el = this.create(`
      <div class="d-flex align-items-center">
        <div name="prefix"></div>
        <div name="input" class="flex-fill">
          <div name="control"></div>
          <small name="error" class="text-danger"></small>
        </div>
        <div name="postfix"></div>
      </div>
    `);
    el.params = params;
    const prefix_div_el = el.querySelector("[name=prefix]");
    const control_div_el = el.querySelector("[name=control]");
    const error_div_el = el.querySelector("[name=error]");
    const postfix_div_el = el.querySelector("[name=postfix]");

    let control_el = null;
    if ("audio_url" == type) {
      control_el = this.create(`<audio controls="" class="w-100"></audio>`);
    } else if ("file" == type) {
      if (el.params.action && "view" == el.params.action.get_type()) {
        // add a download and filesize elements to the prefix
        prefix_div_el.classList.add("text-nowrap", "pe-3");
        prefix_div_el.append(this.create(
          '<button name="download" type="button" class="btn btn-outline-primary">Download</button>'
        ));
        prefix_div_el.append(this.create('<span name="filesize" class="col-form-label ps-2"></span>'));
      }
      control_el = this.create(`<input type="file" class="form-control"></input>`);
      if (el.params.file.mime_type) control_el.accept = el.params.file.mime_type;
    } else if ("boolean" == type) {
      control_el = this.create(`
        <select class="form-select">
          <option value="1">Yes</option>
          <option value="0">No</option>
        </select>
      `);
    } else if (["date", "datetime", "datetimesecond", "dob", "dod"].includes(type)) {
      control_el = this.create(`<input class="form-control"></input>`);
      control_el.addEventListener('click', async () => {
        control_el.value = await new CN_datetime_modal(new Date(), type).open();
      });
    } else if ("enum" == type) {
      control_el = this.create(`<select class="form-select"></select>`);
    } else if (["color", "email", "integer", "float", "password", "size", "string"].includes(type)) {
      control_el = this.create(`<input class="form-control"></input>`);
      if (["color", "email", "password"].includes(type)) control_el.setAttribute("type", type);
    } else if ("rank" == type) {
      control_el = this.create(`<select class="form-select"></select>`);
    } else if (["html", "text"].includes(type)) {
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
      control_el.addEventListener("keyup", () => {
        control_el.value = control_el.value
          .replace(/[^0-9]/g, "")
          .replace(/^([0-9]{2})([0-9]*)/, "$1:$2")
          .replace(/^([0-9]{2}:[0-9]{2}).*/, "$1");
      });
    } else if ("typeahead" == type) {
      control_el = this.create(`<input class="form-control" autocomplete="off"></input>`);

      if (CN_common.is_object(el.params.typeahead)) {
        if (!el.params.typeahead.hasOwnProperty("min_length")) el.params.typeahead.min_length = 2;
        el.params.typeahead.promise = null;
        el.params.typeahead.timeout_id = null;
        el.params.typeahead.open = false;

        // create the typeahead's element
        const typeahead_el = this.create(`
          <div class="dropdown">
            <ul class="dropdown-menu w-100"></ul>
          </div>
        `);
        const dropdown_bs = new bootstrap.Dropdown(typeahead_el);

        // add the typeahead's element after the prop's element once it's been inserted into the DOM
        const observer = new MutationObserver(mutation => {
          if (document.contains(control_el)) {
            control_el.after(typeahead_el);
            observer.disconnect();
          }
        });
        observer.observe(el, { attributes: false, childList: true, characterData: false, subtree: true });

        // track whether the dropdown is open or not
        typeahead_el.addEventListener("shown.bs.dropdown", () => { el.params.typeahead.open = true; });
        typeahead_el.addEventListener("hidden.bs.dropdown", () => { el.params.typeahead.open = false; });

        // cancel the typeahead when the escape key is pressed
        control_el.addEventListener("keydown", (event) => {
          const typeahead = el.params.typeahead;

          if ("Escape" == event.key) {
            if (typeahead.open) {
              if (CN_common.is_function(typeahead.on_cancel)) {
                typeahead.on_cancel();
              }
              dropdown_bs.hide()
            }
          } else if ("Enter" == event.key) {
            if ("" === control_el.value) {
              // the input box is empty, so set to empty
              if (CN_common.is_function(typeahead.on_select)) typeahead.on_select({ value: null });
            }
          }
        });
        control_el.addEventListener("blur", async () => {
          const typeahead = el.params.typeahead;

          // we may be blurring after a button click, so give it time to process
          await CN_common.sleep(200);

          if (typeahead.open) {
            // if the typeahead is still open but we haven't focussed on a dropdown item then cancel and close
            if (!document.activeElement.classList.contains("dropdown-item")) {
              if (CN_common.is_function(typeahead.on_cancel)) {
                typeahead.on_cancel();
              }
              dropdown_bs.hide();
            }
          } else if (el.params.action && el.params.name) {
            if ("" === control_el.value) {
              // the input box is empty, so set to empty
              if (CN_common.is_function(typeahead.on_select)) typeahead.on_select({ value: null });
            } else {
              // return to the last committed value
              el.params.action.get_property(el.params.name).state.undo(true);
            }
          }
        });

        // listen for when the input's value has changed
        control_el.addEventListener("input", async () => {
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
              typeahead.list = await typeahead.get_list(control_el.value, el);
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
                const item_el = this.create(
                  `<li><button type="button" class="dropdown-item">${item.value}</button></li>`
                );
                item_el.addEventListener("click", () => {
                  control_el.value = item.value;
                  if (CN_common.is_function(typeahead.on_select)) typeahead.on_select(item);
                  dropdown_bs.hide();
                });
                item_el.addEventListener("focusout", async () => {
                  // wait after leaving focus so activeElement becomes the newly focussed element
                  await CN_common.sleep(200);

                  if (!control_div_el.contains(document.activeElement)) {
                    // if we've focussed outside of the parent typeahead div then cancel and close
                    if (CN_common.is_function(typeahead.on_cancel)) {
                      typeahead.on_cancel();
                    }
                    dropdown_bs.hide();
                  }
                });
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

      if ("audio_url" == type) {
        // no validation required
      } else if ("file" == type) {
        let files = Array.from(control_el.files);
        if (el.params.action) {
          files = el.params.action.get_property(el.params.name).state.get();
          files = CN_common.is_filelist(files) ? Array.from(files) : [];
        }

        if (el.params.required && 0 == files.length) {
          error = "Can't be empty";
        } else if (el.params.file.mime_type && files.some(file => file.type != el.params.file.mime_type)) {
          error = `Only "${el.params.file.mime_type}" files are allowed.`;
        }
      } else if ([null, ""].includes(control_el.value)) {
        // the value is empty, so just make sure it isn't required
        if (el.params.required) error = "Can't be empty";
      } else { // the value isn't empty, so validate further
        // test the format
        let re = null;
        if (
          "email" == type &&
          !control_el.value.match(/^(([a-zA-Z0-9]+)|([a-zA-Z0-9]+((?:_[a-zA-Z0-9]+)|(?:\.[a-zA-Z0-9]+))*))(@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-zA-Z]{2,6}(?:\.[a-zA-Z]{2})?)$)/)
        ) {
          error = `${control_el.value} is not a valid email address`;
        } else if ("float" == type) {
          re = /^-?(([0-9]+\.?)|([0-9]*\.[0-9]+))$/;
        } else if ("integer" == type) {
          re = /^-?[0-9]+$/;
        } else if (el.params.min_length) {
          if (control_el.value.length < el.params.min_length) {
            error = `Must be at least ${el.params.min_length} characters long`;
          }
        } else if (el.params.format) {
          // determine the regex
          let re = null;
          if ("alphanum" == el.params.format) re = /^[a-zA-Z0-9]+$/;
          else if ("alpha_num" == el.params.format) re = /^[a-zA-Z0-9_]+$/;
          else if ("identifier" == el.params.format) re = /^[^;=\/]+$/;
        }

        // test the implicit regex
        if (re && !re.test(control_el.value)) error = "Invalid format";

        // test the explicit regex
        if (null == error && el.params.regex) {
          let regex_list = CN_common.is_array(el.params.regex) ? el.params.regex : [el.params.regex];
          for (let i = 0; i < regex_list.length; i++) {
            let re = new RegExp(regex_list[i]);
            if (!re.test(control_el.value)) {
              error = "Invalid format";
              break;
            }
          }
        }

        // test numeric ranges
        if (null == error) {
          if (
            ["integer", "float"].includes(type) &&
            null != el.params.min && control_el.value < el.params.min
          ) {
            error = `The smallest number allowed is ${el.params.min}`;
          } else if (
            ["integer", "float"].includes(type) &&
            null != el.params.max && control_el.value > el.params.max
          ) {
            error = `The biggest number allowed is ${el.params.max}`;
          }
        }
      }

      // show any errors
      if (null != error) el.show_error(error);

      return null == error;
    };

    // add an input event listener to all properties except typeaheads (they use on_select instead)
    if ("typeahead" != type) {
      control_el.addEventListener("change", async () => {
        if (["date", "time"].includes(type)) control_el.onkeyup();

        // validate the input
        const valid = el.validate();

        // call the on_change function if it exists
        if (CN_common.is_function(el.params.on_change)) {
          await el.params.on_change(control_el, valid, el.params.action);
        }
      });
    }

    // append the control and add prefix and postfix elements
    control_div_el.append(control_el);
    if (CN_common.is_function(el.params.set_prefix)) prefix_div_el.append(el.params.set_prefix());
    if (CN_common.is_function(el.params.set_postfix)) postfix_div_el.append(el.params.set_postfix());

    if (undefined !== el.params.id) control_el.setAttribute("id", el.params.id);
    if (undefined !== el.params.name) control_el.setAttribute("name", el.params.name);
    if (undefined !== el.params.title) control_el.setAttribute("aria-label", el.params.title);
    if (undefined !== el.params.placeholder) control_el.setAttribute("placeholder", el.params.placeholder);
    if (undefined !== el.params.max_length) control_el.setAttribute("max_length", el.params.max_length);
    if (["boolean", "enum"].includes(type)) {
      if (!el.params.required) {
        let empty = undefined === el.params.placeholder ? "(empty)" : el.params.placeholder;
        control_el.prepend(this.create(`<option value="">${empty}</option>`));
      }
    } else {
      if (el.params.placeholder) control_el.placeholder = el.params.placeholder;
      if (el.params.required) control_el.setAttribute("required", "required");
    }

    el.show_error = async function (error, time = 4000) {
      Object.assign(control_el.style, {
        "border-color": "red",
        "border-width": "3px",
        margin: "-2px",
      });

      if (error) error_div_el.innerHTML = error;

      if (0 < time) {
        await CN_common.sleep(time);
        this.hide_error();
      }
    };

    el.hide_error = function () {
      control_el.style.removeProperty("border-color");
      control_el.style.removeProperty("border-width");
      control_el.style.removeProperty("margin");
      error_div_el.innerHTML = "";
    };

    return el;
  },

  /**
   * Creates a breadcrumb trail based on a model list
   * @param [model] model_list: A list of models in their trail order
   * @return Element
   */
  create_breadcrumb_trail: async function (base_name, model_list = []) {
    // create a list of all crumbs (adding chevrons later)
    const crumb_list = [];

    if ([null, "Error"].includes(base_name)) {
      const unread = 0 == CN_session.system_message_list.filter(message => message.unread).length;
      crumb_list.push({
        name: unread ? "Home" : 'Home <i class="bi-envelope-fill text-warning"></i>',
        path: ""
      });
    }

    if (null != base_name) crumb_list.push({ name: base_name, path: null });

    // run all get_text() async calls in parallel
    await Promise.all(model_list.map(model => (async () => {
      let crumb = { name: "...", path: "view" == model.get_action_name() ? model.get_view_url() : null };
      crumb_list.push(crumb);

      // get the name after we've added the crumb to the list, otherwise it may be out of order
      crumb.name = await model.get_action().get_text("crumb");
    })()));

    // add each crumb to the trail, interspersed by chevrons
    const root_el = this.create("<div></div>");
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
        crumb_el.addEventListener("click", CN_session.navigate_to.bind(CN_session, crumb.path));
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
  create_site_role_modal: function () {
    const el_id = ["cn-site-role-modal", CN_common.get_random_hex_identifier()].join("-");

    const modal_el = this.create(`
      <div id="${el_id}" class="modal fade" tabindex="-1">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header text-bg-primary">
              <h2 class="modal-title fw-bold fs-5">Select Site and Role</h2>
            </div>
            <div class="modal-body">
              <span class="text-info-emphasis">
                Select which site and role you would like to switch to:
              </span>
              <hr />
              <form></form>
            </div>
            <div class="modal-footer text-bg-secondary">
              <button type="button" class="btn btn-light" data-bs-dismiss="modal">Cancel</button>
              <button name="ok" type="button" class="btn btn-primary">OK</button>
            </div>
          </div>
        </div>
      </div>
    `);

    document.getElementById("main-content").append(modal_el);
    const form_el = modal_el.querySelector("form");
    const modal_bs = new bootstrap.Modal(modal_el, { keyboard: false, backdrop: "static" });

    // automatically dispose of the modal once finished
    modal_el.addEventListener("hidden.bs.modal", () => {
      modal_bs.dispose();
      modal_el.remove();
    });

    // used below
    const ok_btn_el = modal_el.querySelector("[name=ok]");

    // add a site enum property
    const site_el_id = ["cn-site", CN_common.get_random_hex_identifier()].join("-");
    const site_el = this.create('<div class="row mb-3"></div>');
    const site_label_el = this.create_form_label({ for: site_el_id, value: "Site" });
    site_label_el.classList.add("col-sm-3");
    site_el.append(site_label_el);
    const site_element_el = this.create_form_element("enum", { id: site_el_id, required: true });
    site_element_el.classList.add("col-sm-9");
    site_el.append(site_element_el);
    form_el.append(site_el);

    // add a role enum property
    const role_el_id = ["cn-role", CN_common.get_random_hex_identifier()].join("-");
    const role_el = this.create('<div class="row mb-3"></div>');
    const role_label_el = this.create_form_label({ for: role_el_id, value: "Role" });
    role_label_el.classList.add("col-sm-3");
    role_el.append(role_label_el);
    const role_element_el = this.create_form_element("enum", { id: role_el_id, required: true });
    role_element_el.classList.add("col-sm-9");
    role_el.append(role_element_el);
    form_el.append(role_el);

    // populate the site and role inputs when opening the modal
    modal_el.addEventListener("show.bs.modal", async () => {
      const data = await CN_api.get("self/0/access");
      const site_list = data.reduce((list, item) => {
        let site = list.find(s => s.id == item.site_id);
        if (!site) {
          site = { id: item.site_id, name: item.site_name, role_list: [] };
          list.push(site);
        }
        site.role_list.push({ id: item.role_id, name: item.role_name });
        return list;
      }, []);

      const site_control_el = document.getElementById(site_el_id);
      const role_control_el = document.getElementById(role_el_id);

      // create a function to update the role list based on the currently selected site list
      const update_role_list = () => {
        role_control_el.innerHTML = "";
        let current_site = site_list.find(site => site.id == site_control_el.value);
        if (current_site) {
          current_site.role_list.forEach(
            role => role_control_el.append(
              this.create(`<option value="${role.id}">${CN_common.uc_words(role.name)}</option>`)
            )
          );
        }
      };

      // populate the site list and set the current site
      site_list.forEach(
        site => site_control_el.append(
          this.create(`<option value="${site.id}">${site.name}</option>`)
        )
      );
      site_control_el.addEventListener("change", update_role_list);
      site_control_el.value = CN_session.data.site.id;

      // populate the role list and set the current role
      update_role_list();
      role_control_el.value = CN_session.data.role.id;
    });

    ok_btn_el.addEventListener("click", async () => {
      modal_bs.hide();
      const site_id = document.getElementById(site_el_id).value;
      const role_id = document.getElementById(role_el_id).value;
      if (CN_session.data.site.id != site_id || CN_session.data.role.id != role_id) {
        // update the user's site and role
        CN_session.set_loading_state(true);
        document.getElementById("main-content").innerHTML = "";
        await CN_api.patch("self/0", { site: { id: site_id }, role: { id: role_id } });
        CN_session.reload(true);
      }
    });

    return modal_bs;
  },

  /**
   * Creates a clock settings modal (for changing the user's time-based preferences)
   * @return bootstrap.Modal
   */
  create_clock_settings_modal: function () {
    const el_id = ["cn-clock-settings-modal", CN_common.get_random_hex_identifier()].join("-");

    const modal_el = this.create(`
      <div id="${el_id}" class="modal fade" tabindex="-1">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header text-bg-primary">
              <h2 class="modal-title fw-bold fs-5">Clock Settings</h2>
            </div>
            <div class="modal-body">
              <span class="text-info-emphasis">
                Select which timezone you would like times to be displayed in.<br />
                Note that most timezones have multiple names, you may choose any.
              </span>
              <hr />
              <form></form>
            </div>
            <div class="modal-footer text-bg-secondary">
              <button type="button" class="btn btn-light" data-bs-dismiss="modal">Cancel</button>
              <button name="ok" type="button" class="btn btn-primary">OK</button>
            </div>
          </div>
        </div>
      </div>
    `);

    document.getElementById("main-content").append(modal_el);
    const form_el = modal_el.querySelector("form");
    const modal_bs = new bootstrap.Modal(modal_el, { keyboard: false, backdrop: "static" });

    // automatically dispose of the modal once finished
    modal_el.addEventListener("hidden.bs.modal", () => {
      modal_bs.dispose();
      modal_el.remove();
    });

    // used below
    const ok_btn_el = modal_el.querySelector("[name=ok]");

    // add a timezone typeahead property
    const timezone_el_id = ["cn-timezone", CN_common.get_random_hex_identifier()].join("-");
    const timezone_el = this.create('<div class="row mb-3"></div>');
    form_el.append(timezone_el);
    const timezone_label_el = this.create_form_label({ for: "csm_timezone", value: "Timezone" });
    timezone_label_el.classList.add("col-sm-3");
    timezone_el.append(timezone_label_el);
    const timezone_element_el = this.create_form_element("typeahead", {
      id: timezone_el_id,
      required: true,
      typeahead: {
        list: CN_timezones,
        on_select: (el) => {
          if (timezone_element_el.validate()) {
            ok_btn_el.removeAttribute("disabled");
          } else {
            ok_btn_el.setAttribute("disabled", true);
          }

          const timezone_control_el = document.getElementById(timezone_el_id);
          timezone_control_el.value = el.value;
          timezone_control_el.last_selected_value = el.value;
        },
        on_cancel: () => {
          const timezone_control_el = document.getElementById(timezone_el_id);
          timezone_control_el.value = timezone_control_el.last_selected_value;
        },
      },
    });
    timezone_element_el.classList.add("col-sm-9");
    timezone_el.append(timezone_element_el);
    const timezone_control_el = document.getElementById(timezone_el_id);
    timezone_control_el.value = CN_session.data.user.timezone;
    timezone_control_el.last_selected_value = CN_session.data.user.timezone;
    timezone_control_el.addEventListener("blur", () => {
      if (!CN_timezones.includes(timezone_control_el.value)) {
        timezone_control_el.value = timezone_control_el.last_selected_value;
      }
    });

    // add a use 12-hour clock boolean property
    const am_pm_el_id = ["cn-am_pm", CN_common.get_random_hex_identifier()].join("-");
    const am_pm_el = this.create('<div class="row mb-3"></div>');
    const am_pm_label_el = this.create_form_label({
      for: am_pm_el_id,
      value: "Use 12-Hour Clock"
    });
    am_pm_label_el.classList.add("col-sm-3");
    am_pm_el.append(am_pm_label_el);
    const am_pm_element_el = this.create_form_element("boolean", {
      id: am_pm_el_id,
      required: true
    });
    am_pm_element_el.classList.add("col-sm-9");
    am_pm_el.append(am_pm_element_el);
    form_el.append(am_pm_el);
    document.getElementById(am_pm_el_id).value = CN_session.data.user.am_pm ? 1 : 0;

    ok_btn_el.addEventListener("click", async () => {
      modal_bs.hide();
      await CN_session.set_timezone(
        timezone_control_el.last_selected_value,
        1 == document.getElementById(am_pm_el_id).value,
      );
    });

    return modal_bs;
  },

  /**
   * Creates an account modal (for changing the user's account details)
   * @return bootstrap.Modal
   */
  create_account_modal: function () {
    const el_id = ["cn-account-modal", CN_common.get_random_hex_identifier()].join("-");

    const modal_el = this.create(`
      <div id="${el_id}" class="modal fade" tabindex="-1">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header text-bg-primary">
              <h2 class="modal-title fw-bold fs-5">Account Details</h2>
            </div>
            <div class="modal-body">
              <span class="text-info-emphasis">
                Update your account details here:
              </span>
              <hr />
              <form></form>
            </div>
            <div class="modal-footer text-bg-secondary">
              <button type="button" class="btn btn-light" data-bs-dismiss="modal">Cancel</button>
              <button name="ok" type="button" class="btn btn-primary">OK</button>
            </div>
          </div>
        </div>
      </div>
    `);

    document.getElementById("main-content").append(modal_el);
    const form_el = modal_el.querySelector("form");
    const modal_bs = new bootstrap.Modal(modal_el, { keyboard: false, backdrop: "static" });

    // automatically dispose of the modal once finished
    modal_el.addEventListener("hidden.bs.modal", () => {
      modal_bs.dispose();
      modal_el.remove();
    });

    // used below
    const ok_btn_el = modal_el.querySelector("[name=ok]");

    // create elements
    const elements = {
      first_name: {
        el_id: ["cn-first-name", CN_common.get_random_hex_identifier()].join("-"),
        title: "First Name",
        type: "string",
      },
      last_name: {
        el_id: ["cn-last-name", CN_common.get_random_hex_identifier()].join("-"),
        title: "Last Name",
        type: "string",
      },
      email: {
        el_id: ["cn-email", CN_common.get_random_hex_identifier()].join("-"),
        title: "Email",
        type: "email",
      },
    };

    for (const id in elements) {
      const element = elements[id];
      const el = this.create('<div class="row mb-3"></div>');
      const label_el = this.create_form_label({ for: element.el_id, value: element.title });
      label_el.classList.add("col-sm-3");
      el.append(label_el);
      const element_el = this.create_form_element(element.type, {
        id: element.el_id,
        required: true,
        on_change: (control_el, valid) => {
          if (valid) {
            ok_btn_el.removeAttribute("disabled");
          } else {
            ok_btn_el.setAttribute("disabled", true);
          }
        },
      });
      element_el.classList.add("col-sm-9");
      el.append(element_el);
      form_el.append(el);
      document.getElementById(element.el_id).value = CN_session.data.user[id];
    }

    ok_btn_el.addEventListener("click", async () => {
      modal_bs.hide();
      let first_name = document.getElementById(elements.first_name.el_id).value;
      let last_name = document.getElementById(elements.last_name.el_id).value;
      let email = document.getElementById(elements.email.el_id).value;
      if (
        CN_session.data.user.first_name != first_name ||
        CN_session.data.user.last_name != last_name ||
        CN_session.data.user.email != email
      ) {
        await this.wait_for(async () => {
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
        });
      }
    });

    return modal_bs;
  },

  /**
   * Creates a password modal (for changing the user's password)
   * @return bootstrap.Modal
   */
  create_password_modal: function () {
    const el_id = ["cn-password-modal", CN_common.get_random_hex_identifier()].join("-");

    const modal_el = this.create(`
      <div id="${el_id}" class="modal fade" tabindex="-1">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header text-bg-primary">
              <h2 class="modal-title fw-bold fs-5">Account Details</h2>
            </div>
            <div class="modal-body">
              <div class="text-info-emphasis">
                Fill out this form to change your password.
              </div>
              <div class="text-warning-emphasis">
                Note that passwords must be at least 8 characters long.
              </div>
              <hr />
              <form></form>
            </div>
            <div class="modal-footer text-bg-secondary">
              <button type="button" class="btn btn-light" data-bs-dismiss="modal">Cancel</button>
              <button name="ok" type="button" class="btn btn-primary" disabled>OK</button>
            </div>
          </div>
        </div>
      </div>
    `);

    document.getElementById("main-content").append(modal_el);
    const form_el = modal_el.querySelector("form");
    const ok_btn_el = modal_el.querySelector("[name=ok]");
    const modal_bs = new bootstrap.Modal(modal_el, { keyboard: false, backdrop: "static" });

    // automatically dispose of the modal once finished
    modal_el.addEventListener("hidden.bs.modal", () => {
      modal_bs.dispose();
      modal_el.remove();
    });

    // create elements
    const elements = {
      current_password: {
        title: "Current Password",
        el_id: ["cn-current-password", CN_common.get_random_hex_identifier()].join("-"),
      },
      new_password: {
        title: "New Password",
        el_id: ["cn-new-password", CN_common.get_random_hex_identifier()].join("-"),
      },
      new_password_check: {
        title: "Repeat New Password",
        el_id: ["cn-password-check", CN_common.get_random_hex_identifier()].join("-"),
      },
    };

    for (const id in elements) {
      const element = elements[id];
      const el = this.create('<div class="row mb-3"></div>');
      const label_el = this.create_form_label({ for: element.el_id, value: element.title });
      label_el.classList.add("col-sm-4");
      el.append(label_el);
      const element_el = this.create_form_element("password", { id: element.el_id, required: true });
      element_el.classList.add("col-sm-8");
      el.append(element_el);
      form_el.append(el);
      element.control_el = document.getElementById(element.el_id);
    }

    // track when the ok button should be enabled
    const update_ok_btn = () => {
      if (
        0 < elements.current_password.control_el.value.length &&
        8 <= elements.new_password.control_el.value.length &&
        8 <= elements.new_password_check.control_el.value.length
      ) {
        ok_btn_el.removeAttribute("disabled");
      } else {
        ok_btn_el.setAttribute("disabled", true);
      }
    };

    elements.current_password.control_el.addEventListener("keyup", update_ok_btn);
    elements.new_password.control_el.addEventListener("keyup", update_ok_btn);
    elements.new_password_check.control_el.addEventListener("keyup", update_ok_btn);

    ok_btn_el.addEventListener("click", async () => {
      let current_password = elements.current_password.control_el.value;
      let new_password = elements.new_password.control_el.value;
      let new_password_check = elements.new_password_check.control_el.value;

      if (new_password !== new_password_check) {
        this.toast({
          title: "Password Mismatch",
          message: "The new passwords do not match.  Please type them again and make sure they are the same.",
          type: "danger",
        });
      } else {
        modal_bs.hide();

        // update the server
        await this.wait_for(async () => {
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
        });
      }
    });

    return modal_bs;
  },

  /**
   * Shows a toast message
   * @param object config:
   *   type: Which bootstrap color type to make the header (default light)
   *   title: The toast's title
   *   message: The toast's message
   */
  toast: function (config) {
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
  wait_for: async function (fn, delay = 500) {
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
    const modal_bs = new bootstrap.Modal(modal_el, { keyboard: false, backdrop: "static" });

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
   * @param object config: An object that has type, title and message properties
   * @return bootstrap.Modal
   */
  message_modal: function (config) {
    if (!config.type) config.type = "primary";
    const modal_el = this.create(`
      <div class="modal fade" tabindex="-1">
        <div class="modal-dialog ${config.size ? "modal-" + config.size : ""}">
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
    const modal_bs = new bootstrap.Modal(modal_el, { keyboard: false, backdrop: "static" });
    modal_bs.block = () => {
      return new Promise((resolve, reject) => {
        modal_bs.show();
        // resolve when closing
        modal_el.addEventListener("hidden.bs.modal", () => resolve(true));
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
   * @param object config: An object that has type, title and message properties
   * @return bootstrap.Modal
   */
  confirm_modal: function (config) {
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
    const modal_bs = new bootstrap.Modal(modal_el, { keyboard: false, backdrop: "static" });
    modal_bs.test = () => {
      return new Promise((resolve, reject) => {
        modal_bs.show();
        modal_el.querySelector("[name=no]").addEventListener("click", () => resolve(false));
        modal_el.querySelector("[name=yes]").addEventListener("click", () => resolve(true));
        // fail to resolve if closing any other way
        modal_el.addEventListener("hidden.bs.modal", () => resolve(false));
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
   * @param object config: An object that has type, title, message, type and required properties
   * @return bootstrap.Modal
   */
  input_modal: function (config) {
    if (undefined === config.id) config.id = ["cn-input", CN_common.get_random_hex_identifier()].join("-");
    if (undefined === config.type) config.type = "primary";
    if (undefined === config.title) config.title = "Please Provide Input";
    if (undefined === config.input) config.input = "string";
    if (undefined === config.do_not_close) config.do_not_close = false;

    const modal_el = this.create(`
      <div class="modal fade" tabindex="-1">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header text-bg-${config.type}">
              <h1 class="modal-title fw-bold fs-5">${config.title}</h1>
            </div>
            <div class="modal-body">
              <label class="form-label text-info-emphasis" for="${config.id}">
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

    const input_el = this.create_form_element(config.input, config);
    modal_el.querySelector(".modal-body").append(input_el);

    document.getElementById("main-content").append(modal_el);
    const control_el = document.getElementById(config.id);
    if (config.value) control_el.value = config.value;

    const modal_bs = new bootstrap.Modal(modal_el, { keyboard: false, backdrop: "static" });
    modal_bs.get = () => {
      return new Promise((resolve, reject) => {
        modal_bs.show();
        modal_el.querySelector("[name=cancel]").addEventListener("click", () => resolve(undefined));
        modal_el.querySelector("[name=confirm]").addEventListener("click", () => {
          if (input_el.validate()) {
            resolve(control_el.value);
            if (!config.do_not_close) modal_bs.hide();
          }
        });
        // resolved undefined if closing any other way
        modal_el.addEventListener("hidden.bs.modal", () => resolve(undefined));
      });
    };

    modal_bs.set_error = (error) => {
      input_el.querySelector("[name=error]").innerHTML = error;
    };

    // update the size of text inputs after the modal is showing
    modal_el.addEventListener("shown.bs.modal", () => {
      if (config.value && "text" == config.input) {
        control_el.style.height = "";
        control_el.style.height = control_el.scrollHeight + "px";
      }
    });

    // automatically dispose of the modal once finished
    modal_el.addEventListener("hidden.bs.modal", () => {
      modal_bs.dispose();
      modal_el.remove();
    });

    return modal_bs;
  },

}
