import CN_common from "../../common.mjs"
import { CN_base_input } from "./base_input.mjs"

const default_config = {
  typeahead: {
    min_length: 2,
    promise: null,
    timeout_id: null,
    open: false,
  },
};

export class CN_input_typeahead extends CN_base_input {
  #typeahead_el;
  #dropdown_bs;

  constructor(config = {}) {
    if (!CN_common.is_object(config)) {
      throw new Error("Non-object config argument passed to CN_input_typeahead contructor");
    }

    // define the default on_select and on_cancel functions
    default_config.typeahead.on_select = (item) => {
      this.set_value(item.value);
      this.commit_value();
      if (this.has_config("on_change")) {
        this.get_config("on_change")(this, this.validate());
      }
    };
    default_config.typeahead.on_cancel = () => {
      this.undo_value(false);
    };

    // don't replace the typeahead property in the config if it's an object, merge it with the default instead
    if (CN_common.is_object(config.typeahead)) {
      config.typeahead = {...default_config.typeahead, ...config.typeahead};
    }

    // convert string list values to objects
    config.typeahead.list = config.typeahead.list.map(
      item => CN_common.is_object(item) ? item : { key: item, value: item }
    );

    super({...default_config, ...config});

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
        if ("" === this.get_value()) {
          // the input box is empty, so set to empty
          if (CN_common.is_function(typeahead.on_select)) typeahead.on_select({ value: null });
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
      } else if (this.get_config("name")) {
        if ("" === this.get_value()) {
          // the input box is empty, so set to empty
          if (CN_common.is_function(typeahead.on_select)) typeahead.on_select({ value: null });
        } else {
          // return to the last committed value
          this.undo_value(true);
        }
      }
    });

    // listen for when the input's value has changed
    el.addEventListener("input", async () => {
          this.#dropdown_bs.show();
      const typeahead = this.get_config("typeahead");

      // only proceed if the typeahead isn't loading and we've reached the min length threshold
      if (typeahead.min_length > this.get_value().length) return;

      // wait for the last request to complete
      await typeahead.promise;

      // clear any previous attempt that happened too soon ago
      if (null != typeahead.timeout_id) {
        clearTimeout(typeahead.timeout_id);
        typeahead.timeout_id = null;
      }

      // wait a short while after the user has stopped typing before proceeding
      typeahead.timeout_id = setTimeout(typeahead.promise = async () => {
        const typeahead = this.get_config("typeahead");
        typeahead.timeout_id = null;

        // generate the list if the get_list() function exists
        if (CN_common.is_function(typeahead.get_list)) {
          typeahead.list = await typeahead.get_list(this.get_value(), this);
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
          .filter(item => item.value.match(new RegExp(RegExp.escape(this.get_value()), "i")))
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

        // now replace the dropdown's list with the matching items
        const ul_el = this.#typeahead_el.querySelector("ul");
        ul_el.innerHTML = "";
        li_el_list.forEach(item_el => ul_el.append(item_el));
        if (!typeahead.open) {
          this.#dropdown_bs.show();
        }
      }, 200);
    });

    return el;
  }

  /**
   * Extend parent method
   */
  get_formatted_value() {
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
}
