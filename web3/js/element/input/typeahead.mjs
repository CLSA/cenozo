import { CN_base_input } from "./base_input.mjs"
import { CN_common } from "../../common.mjs"

export class CN_input_typeahead extends CN_base_input {
  #typeahead_el;
  #dropdown_bs;

  constructor(parent_el, config = {}) {
    if (!CN_common.is_object(config)) {
      throw new Error("Non-object config argument passed to CN_input_typeahead contructor");
    }

    const default_config = {
      typeahead: {
        min_length: 2,
        promise: null,
        timeout_id: null,
        open: false,
        on_select: (item) => {
          this.set_value(item.value);
          this.commit_value();
          if (this.has_config("on_change")) {
            this.get_config("on_change")(this, this.validate());
          }
        },
        on_cancel: () => {
          this.undo_value(false);
        },
      },
    };

    // don't replace the typeahead property in the config if it's an object, merge it with the default instead
    if (CN_common.is_object(config.typeahead)) {
      config.typeahead = {...default_config.typeahead, ...config.typeahead};
    }

    // convert string list values to objects
    if (CN_common.is_array(config.typeahead.list)) {
      config.typeahead.list = config.typeahead.list.map(
        item => CN_common.is_object(item) ? item : { key: item, value: item }
      );
    }

    super(parent_el, {...default_config, ...config});

    // prevent the base class from adding event listeners (alternative events listened to below)
    this.set_event_listeners(false);
  }

  /**
   * Extends the parent method
   */
  _create_control_element() {
    const el = this.constructor.html('<input class="form-control" autocomplete="off"></input>');

    // create the typeahead's element
    // NOTE: the invisible button is needed in order for arrow-keys to navigate the dropdown list
    this.#typeahead_el = this.constructor.html(`
      <div class="dropdown">
        <button type="button" class="d-none" data-bs-toggle="dropdown"></button>
        <ul class="dropdown-menu w-100"></ul>
      </div>
    `);
    this.#dropdown_bs = new bootstrap.Dropdown(this.#typeahead_el);

    // track whether the dropdown is open or not
    this.#typeahead_el.addEventListener(
      "shown.bs.dropdown",
      () => { this.get_config("typeahead").open = true; }
    );
    this.#typeahead_el.addEventListener(
      "hidden.bs.dropdown",
      () => { this.get_config("typeahead").open = false; }
    );

    // cancel the typeahead when the escape key is pressed
    el.addEventListener("keydown", (event) => {
      const typeahead = this.get_config("typeahead");
      if ("Escape" == event.key) {
        if (typeahead.open) {
          if (CN_common.is_function(typeahead.on_cancel)) typeahead.on_cancel();
          this.#dropdown_bs.hide();
        }
      } else if ("Enter" == event.key) {
        if (null === this.get_value()) {
          // the input box is empty, so set to empty
          if (CN_common.is_function(typeahead.on_select)) typeahead.on_select({ value: null });
          this.#dropdown_bs.hide();
        }
      }
    });
    el.addEventListener("blur", async () => {
      // we may be blurring after a button click, so give it time to process
      await CN_common.sleep(200);

      const typeahead = this.get_config("typeahead");
      if (typeahead.open) {
        // if the typeahead is still open but we haven't focussed on a dropdown item then cancel and close
        if (!document.activeElement.classList.contains("dropdown-item")) {
          if (CN_common.is_function(typeahead.on_cancel)) typeahead.on_cancel();
          this.#dropdown_bs.hide();
        }
      } else {
        if (null === this.get_value()) {
          // the input box is empty, so set to empty
          if (CN_common.is_function(typeahead.on_select)) typeahead.on_select({ value: null });
          this.#dropdown_bs.hide();
        } else {
          // return to the last committed value
          this.undo_value(true);
        }
      }
    });

    // listen for when the input's value has changed
    el.addEventListener("input", async () => {
      const typeahead = this.get_config("typeahead");

      // wait for the last request to complete
      await typeahead.promise;

      // clear any previous attempt that happened too soon ago
      if (null != typeahead.timeout_id) {
        clearTimeout(typeahead.timeout_id);
        typeahead.timeout_id = null;
      }

      // wait a short while after the user has stopped typing before proceeding
      typeahead.timeout_id = setTimeout(typeahead.promise = async () => {
        const value = this.get_value();
        const typeahead = this.get_config("typeahead");
        typeahead.timeout_id = null;

        // only proceed if the typeahead isn't loading and we've reached the min length threshold
        let li_el_list = [];
        if (null != value && typeahead.min_length <= value.length) {
          // generate the list if the get_list() function exists
          if (CN_common.is_function(typeahead.get_list)) {
            typeahead.list = null === value ? [] : await typeahead.get_list(value, this);
          }

          // convert string values to objects with key and value pairs
          typeahead.list = typeahead.list.map(
            item => CN_common.is_object(item) ? item : { key: item, value: item }
          );

          // now create a list of <li> elements for the typeahead's <ul> element
          // NOTE: it's important to do this before replacing the <ul> children below (based on execute time)
          if (null != value) {
            li_el_list = typeahead.list
              // Make sure only matching items are included (this is already done in get_list() but not when
              // the list isn't dynamic
              .filter(item => item.value.match(new RegExp(RegExp.escape(value), "i")))
              .map(item => {
                const item_el = this.constructor.html(
                  `<li><button type="button" class="dropdown-item">${item.value}</button></li>`
                );
                item_el.addEventListener("click", () => {
                  const typeahead = this.get_config("typeahead");
                  this.set_value(item.value);
                  if (CN_common.is_function(typeahead.on_select)) typeahead.on_select(item);
                  this.#dropdown_bs.hide();
                });
                return item_el;
              }).slice(0, 20); // only use the first 20 results (to limit the size of the dropdown list)
          }
        }


        // now replace the dropdown's list with the matching items
        const ul_el = this.#typeahead_el.querySelector("ul");
        ul_el.innerHTML = "";
        li_el_list.forEach(item_el => ul_el.append(item_el));
        if (0 < li_el_list.length && !typeahead.open) {
          this.#dropdown_bs.show();
        } else if (0 == li_el_list.length && typeahead.open)  {
          this.#dropdown_bs.hide();
        }
      }, 200);
    });

    return el;
  }

  /**
   * Extend parent method
   */
  get_value() {
    let value = super.get_value();
    if (CN_common.is_string(value)) value = value.trim();
    return "" === value ? null : value;
  }

  /**
   * Extend parent method
   */
  async get_value_for_record() {
    // convert from value to key by looking up the element's typeahead list in the params object
    // NOTE: the element's params is not the same as the property's params object (it is cloned)
    let value = this.get_value();
    if (null != value) {
      value = this.get_config("typeahead").list.find(item => value === item.value).key;
    }
    return value;
  }

  /**
   * Extend parent method
   */
  async on_dom_add() {
    await super.on_dom_add();

    // add the typeahead's element after the prop's element once it's been inserted into the DOM
    this.get_control_element().after(this.#typeahead_el);
  }

  /**
   * Convenience method to create and render the element (without needing access to the created object)
   * @param object params: The parameters sent to the class constructor
   * @return Element
   */
  static create_element(parent_el = null, config = {}) {
    const el = new CN_input_typeahead(parent_el, config).get_element();
    if (parent_el) parent_el.append(el);
    return el;
  }
}
