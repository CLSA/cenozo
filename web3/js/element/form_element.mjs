import CN_common from "../common.mjs"
import CN_datetime_modal, { DATE_TYPES } from "../date/datetime_modal.mjs"
import { CN_base_element } from "./base_element.mjs"

const default_config = {
  type: "div",
  class: "d-flex align-items-center",
};

export class CN_form_element extends CN_base_element {
  #element_type;
  #control_id;
  #control_name;
  #control_el;
  #prefix_div_el;
  #input_div_el;
  #control_div_el;
  #error_div_el;
  #postfix_div_el;

  /**
   * Creates a form element
   * @param string type: One of the following:
   *   "audio_url", "boolean", "color", "date", "datetime", "datetimesecond", "dob", "dod", "email", "enum",
   *   "file", "float", "html", "integer", "password", "rank", "size", "string", "text", "time", or "typeahead"
   * @param object params: An object defining the element (properties depending on element type)
   * @return Element
   */
  constructor(element_type, config = {}) {
    if (!CN_common.is_object(config)) {
      throw new Error("Non-object config argument passed to CN_form_element contructor");
    }

    const id = config.id;
    delete config.id;
    const name = config.name;
    delete config.name;

    super({...default_config, ...config});

    this.#element_type = element_type;
    this.#control_id = id;
    this.#control_name = name;
  }

  /**
   * Extends the parent method
   */
  _create_element() {
    const el = super._create_element();

    this.#prefix_div_el = this.constructor.html('<div name="prefix"></div>');
    el.append(this.#prefix_div_el);
    this.#input_div_el = this.constructor.html('<div name="input" class="flex-fill"></div>');
    el.append(this.#input_div_el);
    this.#control_div_el = this.constructor.html('<div name="control"></div>');
    this.#input_div_el.append(this.#control_div_el);
    this.#error_div_el = this.constructor.html('<div name="error" class="text-danger"></div>');
    this.#input_div_el.append(this.#error_div_el);
    this.#postfix_div_el = this.constructor.html('<div name="postfix"></div>');
    el.append(this.#postfix_div_el);

    this.#control_el = null;
    if ("audio_url" == this.#element_type) {
      this.#control_el = this.constructor.html(`<audio controls="" class="w-100"></audio>`);
    } else if ("file" == this.#element_type) {
      this.#control_el = this.constructor.html(`<input type="file" class="form-control"></input>`);
      if (this.get_config("file").mime_type) this.#control_el.accept = this.get_config("file").mime_type;
    } else if ("boolean" == this.#element_type) {
      this.#control_el = this.constructor.html(`
        <select class="form-select">
          <option value="1">Yes</option>
          <option value="0">No</option>
        </select>
      `);
    } else if (["date", "datetime", "datetimesecond", "dob", "dod"].includes(this.#element_type)) {
      this.#control_el = this.constructor.html(`<input class="form-control"></input>`);
      this.#control_el.addEventListener('click', async () => {
        this.#control_el.value = await new CN_datetime_modal(new Date(), this.#element_type).open();
      });
    } else if ("enum" == this.#element_type) {
      this.#control_el = this.constructor.html(`<select class="form-select"></select>`);
    } else if (["color", "email", "integer", "float", "password", "size", "string"].includes(this.#element_type)) {
      this.#control_el = this.constructor.html(`<input class="form-control"></input>`);
      if (["color", "email", "password"].includes(this.#element_type)) {
        this.#control_el.setAttribute("type", this.#element_type);
      }
    } else if ("rank" == this.#element_type) {
      this.#control_el = this.constructor.html(`<select class="form-select"></select>`);
    } else if (["html", "text"].includes(this.#element_type)) {
      this.#control_el = this.constructor.html(`
        <textarea
          class="form-control"
          oninput="
            this.style.height = '';
            this.style.height = this.scrollHeight + 'px';
          "
        ></textarea>
      `);
    } else if ("time" == this.#element_type) {
      if (!this.has_config("placeholder")) this.set_config("placeholder", "HH:MM");

      this.#control_el = this.constructor.html(`<input class="form-control"></input>`);
      this.#control_el.addEventListener("keyup", () => {
        this.#control_el.value = this.#control_el.value
          .replace(/[^0-9]/g, "")
          .replace(/^([0-9]{2})([0-9]*)/, "$1:$2")
          .replace(/^([0-9]{2}:[0-9]{2}).*/, "$1");
      });
    } else if ("typeahead" == this.#element_type) {
      this.#control_el = this.constructor.html(`<input class="form-control" autocomplete="off"></input>`);

      if (CN_common.is_object(this.get_config("typeahead"))) {
        const typeahead = this.get_config("typeahead");
        if (!typeahead.hasOwnProperty("min_length")) {
          typeahead.min_length = 2;
        }
        typeahead.promise = null;
        typeahead.timeout_id = null;
        typeahead.open = false;

        // create the typeahead's element
        const typeahead_el = this.constructor.html(`
          <div class="dropdown">
            <ul class="dropdown-menu w-100"></ul>
          </div>
        `);
        const dropdown_bs = new bootstrap.Dropdown(typeahead_el);

        // add the typeahead's element after the prop's element once it's been inserted into the DOM
        const observer = new MutationObserver(mutation => {
          if (document.contains(this.#control_el)) {
            this.#control_el.after(typeahead_el);
            observer.disconnect();
          }
        });
        observer.observe(el, { attributes: false, childList: true, characterData: false, subtree: true });

        // track whether the dropdown is open or not
        typeahead_el.addEventListener("shown.bs.dropdown", () => { typeahead.open = true; });
        typeahead_el.addEventListener("hidden.bs.dropdown", () => { typeahead.open = false; });

        // cancel the typeahead when the escape key is pressed
        this.#control_el.addEventListener("keydown", (event) => {
          if ("Escape" == event.key) {
            if (typeahead.open) {
              if (CN_common.is_function(typeahead.on_cancel)) {
                typeahead.on_cancel();
              }
              dropdown_bs.hide()
            }
          } else if ("Enter" == event.key) {
            if ("" === this.#control_el.value) {
              // the input box is empty, so set to empty
              if (CN_common.is_function(typeahead.on_select)) typeahead.on_select({ value: null });
            }
          }
        });
        this.#control_el.addEventListener("blur", async () => {
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
          } else if (this.get_config("action") && this.get_config("name")) {
            if ("" === this.#control_el.value) {
              // the input box is empty, so set to empty
              if (CN_common.is_function(typeahead.on_select)) typeahead.on_select({ value: null });
            } else {
              // return to the last committed value
              this.get_config("action").get_property(this.get_config("name")).state.undo(true);
            }
          }
        });

        // listen for when the input's value has changed
        this.#control_el.addEventListener("input", async () => {
          // only proceed if the typeahead isn't loading and we've reached the min length threshold
          if (typeahead.min_length > this.#control_el.value.length) return;

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
              typeahead.list = await typeahead.get_list(this.#control_el.value, el);
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
              .filter(item => item.value.match(new RegExp(this.#control_el.value, "i")))
              .map(item => {
                const item_el = this.constructor.html(
                  `<li><button type="button" class="dropdown-item">${item.value}</button></li>`
                );
                item_el.addEventListener("click", () => {
                  this.#control_el.value = item.value;
                  if (CN_common.is_function(typeahead.on_select)) typeahead.on_select(item);
                  dropdown_bs.hide();
                });
                item_el.addEventListener("focusout", async () => {
                  // wait after leaving focus so activeElement becomes the newly focussed element
                  await CN_common.sleep(200);

                  if (!el.querySelector("[name=control]").contains(document.activeElement)) {
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
      console.error(
        `Tried to create form element using a missing or invalid type "${this.#element_type}".`
      );
    }

    this.#control_div_el.append(this.#control_el);

    if ("file" == this.#element_type) {
      if (this.get_config("action") && "view" == this.get_config("action").get_type()) {
        // add a download and filesize elements to the prefix
        this.#prefix_div_el.classList.add("text-nowrap", "pe-3");
        this.#prefix_div_el.append(this.constructor.html(
          '<button name="download" type="button" class="btn btn-outline-primary">Download</button>'
        ));
        this.#prefix_div_el.append(
          this.constructor.html('<span name="filesize" class="col-form-label ps-2"></span>')
        );
      }
    }

    // add an input event listener to all properties except typeaheads (they use on_select instead)
    if ("typeahead" != this.#element_type) {
      this.#control_el.addEventListener("change", async () => {
        if (["date", "time"].includes(this.#element_type)) this.#control_el.onkeyup();

        // validate the input
        const valid = this.validate();

        // call the on_change function if it exists
        if (CN_common.is_function(this.get_config("on_change"))) {
          await this.get_config("on_change")(this.#control_el, valid, this.get_config("action"));
        }
      });
    }

    // append the control and add prefix and postfix elements
    if (this.has_config("prefix")) {
      const prefix = this.get_config("prefix");
      this.#prefix_div_el.append(CN_common.is_function(prefix) ? prefix() : prefix);
    }
    if (this.has_config("postfix")) {
      const postfix = this.get_config("postfix");
      this.#postfix_div_el.append(CN_common.is_function(postfix) ? postfix() : postfix);
    }

    if (this.#control_id) this.#control_el.setAttribute("id", this.#control_id);
    if (this.has_config("name")) this.#control_el.setAttribute("name", this.#control_name);
    if (this.has_config("title")) this.#control_el.setAttribute("aria-label", this.get_config("title"));
    if (this.has_config("placeholder")) this.#control_el.setAttribute("placeholder", this.get_config("placeholder"));
    if (this.has_config("max_length")) this.#control_el.setAttribute("max_length", this.get_config("max_length"));
    if (["boolean", "enum"].includes(this.#element_type)) {
      if (!this.get_config("required")) {
        let empty = !this.has_config("placeholder") ? "(empty)" : this.get_config("placeholder");
        this.#control_el.prepend(this.constructor.html(`<option value="">${empty}</option>`));
      }
    } else {
      if (this.has_config("placeholder")) this.#control_el.placeholder = this.get_config("placeholder");
      if (this.has_config("required")) this.#control_el.setAttribute("required", "required");
    }

    return el;
  }

  // create the element's validate function
  validate() {
    // determine if there was an error
    let error = null;

    if ("audio_url" == this.#element_type) {
      // no validation required
    } else if ("file" == this.#element_type) {
      let files = Array.from(this.#control_el.files);
      if (this.get_config("action")) {
        files = this.get_config("action").get_property(this.get_config("name")).state.get();
        files = CN_common.is_filelist(files) ? Array.from(files) : [];
      }

      if (this.get_config("required") && 0 == files.length) {
        error = "Can't be empty";
      } else if (
        this.get_config("file").mime_type &&
        files.some(file => file.this.#element_type != this.get_config("file").mime_type)
      ) {
        error = `Only "${this.get_config("file").mime_type}" files are allowed.`;
      }
    } else if ([null, ""].includes(this.#control_el.value)) {
      // the value is empty, so just make sure it isn't required
      if (this.get_config("required")) error = "Can't be empty";
    } else { // the value isn't empty, so validate further
      // test the format
      let re = null;
      if (
        "email" == this.#element_type &&
        !this.#control_el.value.match(/^(([a-zA-Z0-9]+)|([a-zA-Z0-9]+((?:_[a-zA-Z0-9]+)|(?:\.[a-zA-Z0-9]+))*))(@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-zA-Z]{2,6}(?:\.[a-zA-Z]{2})?)$)/)
      ) {
        error = `${this.#control_el.value} is not a valid email address`;
      } else if ("float" == this.#element_type) {
        re = /^-?(([0-9]+\.?)|([0-9]*\.[0-9]+))$/;
      } else if ("integer" == this.#element_type) {
        re = /^-?[0-9]+$/;
      } else if (this.get_config("min_length")) {
        if (this.#control_el.value.length < this.get_config("min_length")) {
          error = `Must be at least ${this.get_config("min_length")} characters long`;
        }
      } else if (this.get_config("format")) {
        // determine the regex
        let re = null;
        if ("alphanum" == this.get_config("format")) re = /^[a-zA-Z0-9]+$/;
        else if ("alpha_num" == this.get_config("format")) re = /^[a-zA-Z0-9_]+$/;
        else if ("identifier" == this.get_config("format")) re = /^[^;=\/]+$/;
      }

      // test the implicit regex
      if (re && !re.test(this.#control_el.value)) error = "Invalid format";

      // test the explicit regex
      if (null == error && this.get_config("regex")) {
        let regex_list = (
          CN_common.is_array(this.get_config("regex")) ?
          this.get_config("regex") :
          [this.get_config("regex")]
        );
        for (let i = 0; i < regex_list.length; i++) {
          let re = new RegExp(regex_list[i]);
          if (!re.test(this.#control_el.value)) {
            error = "Invalid format";
            break;
          }
        }
      }

      // test numeric ranges
      if (null == error) {
        if (
          ["integer", "float"].includes(this.#element_type) &&
          null != this.get_config("min") && this.#control_el.value < this.get_config("min")
        ) {
          error = `The smallest number allowed is ${this.get_config("min")}`;
        } else if (
          ["integer", "float"].includes(this.#element_type) &&
          null != this.get_config("max") && this.#control_el.value > this.get_config("max")
        ) {
          error = `The biggest number allowed is ${this.get_config("max")}`;
        }
      }
    }

    // show any errors
    if (null != error) el.show_error(error, 4000);

    return null == error;
  }

  async show_error(error, time = 300) {
    // ignore the request if the error div hasn't been created yet
    if (!this.#error_div_el) return;

    Object.assign(this.#control_el.style, {
      "border-color": "red",
      "border-width": "3px",
      margin: "-2px",
    });

    if (error) this.#error_div_el.innerHTML = error;

    if (0 < time) {
      await CN_common.sleep(time);
      this.hide_error();
    }
  }

  hide_error() {
    // ignore the request if the error div hasn't been created yet
    if (!this.#error_div_el) return;

    this.#control_el.style.removeProperty("border-color");
    this.#control_el.style.removeProperty("border-width");
    this.#control_el.style.removeProperty("margin");
    this.#error_div_el.innerHTML = "";
  }

  /**
   * Convenience method to create and render the element (without needing access to the created object)
   * @param object params: The parameters sent to the class constructor
   * @return Element
   */
  static create(element_type, config) { return (new CN_form_element(element_type, config)).render(); }
}
