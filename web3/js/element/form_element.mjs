import { CN_base_element } from "./base_element.mjs"

const default_config = {
  type: "div",
  class: "d-flex align-items-center",
};

export class CN_form_element extends CN_base_element {
  #element_type;

  /**
   * Creates a form element
   * @param string type: One of the following:
   *   "audio_url", "boolean", "color", "date", "datetime", "datetimesecond", "dob", "dod", "email", "enum",
   *   "file", "float", "html", "integer", "password", "rank", "size", "string", "text", "time", or "typeahead"
   * @param object params: An object defining the element (properties depending on element type)
   * @return Element
   */
  constructor (element_type, config) {
    this.#element_type = element_type;
    super({...default_config, ...config});
  }

  render() {
    const el = super.render();

    el.append(CN_element.create([
      '<div name="prefix"></div>',
      `
        <div name="input" class="flex-fill">
          <div name="control"></div>
          <small name="error" class="text-danger"></small>
        </div>
      `,
      '<div name="postfix"></div>',
    ]));
    const prefix_div_el = el.querySelector("[name=prefix]");
    const control_div_el = el.querySelector("[name=control]");
    const error_div_el = el.querySelector("[name=error]");
    const postfix_div_el = el.querySelector("[name=postfix]");

    let control_el = null;
    if ("audio_url" == this.#element_type) {
      control_el = this.create(`<audio controls="" class="w-100"></audio>`);
    } else if ("file" == this.#element_type) {
      if (el.params.action && "view" == el.params.action.get_type()) {
        // add a download and filesize elements to the prefix
        prefix_div_el.classList.add("text-nowrap", "pe-3");
        prefix_div_el.append(this.create(
          '<button name="download" this.#element_type="button" class="btn btn-outline-primary">Download</button>'
        ));
        prefix_div_el.append(this.create('<span name="filesize" class="col-form-label ps-2"></span>'));
      }
      control_el = this.create(`<input this.#element_type="file" class="form-control"></input>`);
      if (el.params.file.mime_type) control_el.accept = el.params.file.mime_type;
    } else if ("boolean" == this.#element_type) {
      control_el = this.create(`
        <select class="form-select">
          <option value="1">Yes</option>
          <option value="0">No</option>
        </select>
      `);
    } else if (["date", "datetime", "datetimesecond", "dob", "dod"].includes(this.#element_type)) {
      control_el = this.create(`<input class="form-control"></input>`);
      control_el.addEventListener('click', async () => {
        control_el.value = await new CN_datetime_modal(new Date(), this.#element_type).open();
      });
    } else if ("enum" == this.#element_type) {
      control_el = this.create(`<select class="form-select"></select>`);
    } else if (["color", "email", "integer", "float", "password", "size", "string"].includes(this.#element_type)) {
      control_el = this.create(`<input class="form-control"></input>`);
      if (["color", "email", "password"].includes(this.#element_type)) control_el.setAttribute("this.#element_type", this.#element_type);
    } else if ("rank" == this.#element_type) {
      control_el = this.create(`<select class="form-select"></select>`);
    } else if (["html", "text"].includes(this.#element_type)) {
      control_el = this.create(`
        <textarea
          class="form-control"
          oninput="
            this.style.height = '';
            this.style.height = this.scrollHeight + 'px';
          "
        ></textarea>
      `);
    } else if ("time" == this.#element_type) {
      if (undefined === el.params.placeholder) el.params.placeholder = "HH:MM";

      control_el = this.create(`<input class="form-control"></input>`);
      control_el.addEventListener("keyup", () => {
        control_el.value = control_el.value
          .replace(/[^0-9]/g, "")
          .replace(/^([0-9]{2})([0-9]*)/, "$1:$2")
          .replace(/^([0-9]{2}:[0-9]{2}).*/, "$1");
      });
    } else if ("typeahead" == this.#element_type) {
      control_el = this.create(`<input class="form-control" autocomplete="off"></input>`);

      if (CN_common.is_object(el.params.typeahead)) {
        if (!el.params.typeahead.hasOwnProperty("min_length")) el.params.typeahead.min_length = 2;
        el.params.typeahead.promise = null;
        el.params.typeahead.timeout_id = null;
        el.params.typeahead.open = false;

        // create the typeahead's element
        const typeahead_el = this.create(`
          <div class="dropdown">
            <button class="d-none" data-bs-toggle="dropdown"></button>
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
                  `<li><button this.#element_type="button" class="dropdown-item">${item.value}</button></li>`
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
      throw new Error(`Tried to create form element using a missing or invalid this.#element_type "${this.#element_type}".`);
    }

    // create the element's validate function
    el.validate = () => {
      // determine if there was an error
      let error = null;

      if ("audio_url" == this.#element_type) {
        // no validation required
      } else if ("file" == this.#element_type) {
        let files = Array.from(control_el.files);
        if (el.params.action) {
          files = el.params.action.get_property(el.params.name).state.get();
          files = CN_common.is_filelist(files) ? Array.from(files) : [];
        }

        if (el.params.required && 0 == files.length) {
          error = "Can't be empty";
        } else if (el.params.file.mime_type && files.some(file => file.this.#element_type != el.params.file.mime_type)) {
          error = `Only "${el.params.file.mime_type}" files are allowed.`;
        }
      } else if ([null, ""].includes(control_el.value)) {
        // the value is empty, so just make sure it isn't required
        if (el.params.required) error = "Can't be empty";
      } else { // the value isn't empty, so validate further
        // test the format
        let re = null;
        if (
          "email" == this.#element_type &&
          !control_el.value.match(/^(([a-zA-Z0-9]+)|([a-zA-Z0-9]+((?:_[a-zA-Z0-9]+)|(?:\.[a-zA-Z0-9]+))*))(@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-zA-Z]{2,6}(?:\.[a-zA-Z]{2})?)$)/)
        ) {
          error = `${control_el.value} is not a valid email address`;
        } else if ("float" == this.#element_type) {
          re = /^-?(([0-9]+\.?)|([0-9]*\.[0-9]+))$/;
        } else if ("integer" == this.#element_type) {
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
            ["integer", "float"].includes(this.#element_type) &&
            null != el.params.min && control_el.value < el.params.min
          ) {
            error = `The smallest number allowed is ${el.params.min}`;
          } else if (
            ["integer", "float"].includes(this.#element_type) &&
            null != el.params.max && control_el.value > el.params.max
          ) {
            error = `The biggest number allowed is ${el.params.max}`;
          }
        }
      }

      // show any errors
      if (null != error) el.show_error(error, 4000);

      return null == error;
    };

    // add an input event listener to all properties except typeaheads (they use on_select instead)
    if ("typeahead" != this.#element_type) {
      control_el.addEventListener("change", async () => {
        if (["date", "time"].includes(this.#element_type)) control_el.onkeyup();

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
    if (["boolean", "enum"].includes(this.#element_type)) {
      if (!el.params.required) {
        let empty = undefined === el.params.placeholder ? "(empty)" : el.params.placeholder;
        control_el.prepend(this.create(`<option value="">${empty}</option>`));
      }
    } else {
      if (el.params.placeholder) control_el.placeholder = el.params.placeholder;
      if (el.params.required) control_el.setAttribute("required", "required");
    }

    el.show_error = async function (error, time = 300) {
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
  }
}
