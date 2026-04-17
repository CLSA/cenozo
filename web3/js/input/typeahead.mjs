import { CN_base_input } from "./base_input.mjs"
import { CN_common } from "../common.mjs"

export class CN_input_typeahead extends CN_base_input {
  #typeahead_el;
  #dropdown_bs;
  #active_item;
  #selection_made = false;
  #input_changed = false;

  constructor(parent_el, config = {}) {
    if (!CN_common.is_object(config)) {
      throw new Error("Non-object config argument passed to CN_input_typeahead constructor");
    }

    const default_config = {
      typeahead: {
        min_length: 2,
        allow_new: false,
        promise: null,
        timeout_id: null,
        open: false,
        on_select: async (form_input, item) => {
          this.set_value(item.value);
          this.commit_value();
          if (this.has_config("on_change")) {
            this.get_config("on_change")(this, await this.validate());
          }
        },
        on_cancel: () => {
          this.undo_value(false);
          this.#input_changed = false;
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
  async on_dom_add() {
    await super.on_dom_add();

    // add the typeahead's element after the prop's element once it's been inserted into the DOM
    this.get_control_element().after(this.#typeahead_el);
  }

  /**
   * ADD DOCS
   */
  async select_previous() {
    if (!this.#active_item) return;

    const list = this.#get_matching_list(this.get_value());
    if (0 == list.length) return;

    const new_index = list.map(item => item.key).indexOf(this.#active_item.key) - 1;
    if (list[new_index]) this.#active_item = list[new_index];

    await this.update();
  }

  /**
   * ADD DOCS
   */
  async select_next() {
    if (!this.#active_item) return;

    const list = this.#get_matching_list(this.get_value());
    if (0 == list.length) return;

    const new_index = list.map(item => item.key).indexOf(this.#active_item.key) + 1;
    if (list[new_index]) this.#active_item = list[new_index];

    await this.update();
  }

  /**
   * Extend parent method
   */
  async update() {
    await super.update();

    Array.from(this.#typeahead_el.querySelectorAll("ul button")).forEach(button_el => {
      if (this.#active_item && button_el.getAttribute("name") == String(this.#active_item.key)) {
        button_el.classList.add("text-bg-primary");
      } else {
        button_el.classList.remove("text-bg-primary");
      }
    });
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
    this.#typeahead_el.addEventListener("shown.bs.dropdown", () => {
      this.get_config("typeahead").open = true;
    });
    this.#typeahead_el.addEventListener("hidden.bs.dropdown", () => {
      this.get_config("typeahead").open = false;
    });

    el.addEventListener("keydown", (event) => {
      const typeahead = this.get_config("typeahead");

      if (typeahead.open && ["Escape", "ArrowUp", "ArrowDown", "Enter", "Tab"].includes(event.key)) {
        event.preventDefault();
      }

      if ("Escape" == event.key) {
        if (typeahead.open) {
          if (CN_common.is_function(typeahead.on_cancel)) typeahead.on_cancel();
          this.#dropdown_bs.hide();
        }
      } else if ("ArrowUp" == event.key) {
        this.select_previous();
      } else if ("ArrowDown" == event.key) {
        this.select_next();
      } else if ("Enter" == event.key) {
        const value = this.get_value();
        if (null === value) {
          // the input box is empty, so set to empty
          typeahead.on_select(this, { key: undefined, value: null });
          this.#dropdown_bs.hide();
        } else {
          if (typeahead.open) {
            if (this.#active_item) {
              typeahead.on_select(this, this.#active_item);
              this.#selection_made = true;
              this.#input_changed = false;
              this.#dropdown_bs.hide();
            }
          } else if (typeahead.allow_new) {
            typeahead.on_select(this, { key: undefined, value: value });
          }
        }
      }
    });

    el.addEventListener("blur", async () => {
      // we may be blurring after a button click, so give it time to process
      await CN_common.sleep(200);

      if (this.#selection_made) {
        this.#selection_made = false;
      } else {
        const typeahead = this.get_config("typeahead");
        if (typeahead.open) {
          // if the typeahead is still open but we haven't focussed on a dropdown item then cancel and close
          if (!document.activeElement.classList.contains("dropdown-item")) {
            if (CN_common.is_function(typeahead.on_cancel)) typeahead.on_cancel();
            this.#dropdown_bs.hide();
          }
        } else if (this.#input_changed) {
          if (null === this.get_value()) {
            // the input box is empty, so set to empty
            typeahead.on_select(this, { key: undefined, value: null });
            this.#dropdown_bs.hide();
          } else {
            // return to the last committed value
            this.undo_value(true);
            this.#input_changed = false;
          }
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
        this.#input_changed = true;
        const value = this.get_value();
        const typeahead = this.get_config("typeahead");
        typeahead.timeout_id = null;

        // only determine the list if we've reached the min length threshold
        this.#active_item = null;
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
            li_el_list = this.#get_matching_list(value).map((item, index) => {
              if (0 == index) this.#active_item = item;

              const item_el = this.constructor.html(`
                <li>
                  <button
                    name="${item.key}"
                    type="button"
                    class="dropdown-item ${item.key == this.#active_item.key ? "text-bg-primary" : ""}"
                  >${item.value}</button>
                </li>
              `);
              item_el.addEventListener("click", async () => {
                this.#active_item = item;
                await this.update();

                this.get_config("typeahead").on_select(this, item);
                this.#selection_made = true;
                this.#input_changed = false;
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
  async _calculate_value_for_record(value) {
    if (!this.#active_item) {
      const list = this.#get_matching_list(value);
      if (0 < list.length) this.#active_item = list[0];
    }
    return this.#active_item ? this.#active_item.key : null;
  }

  /**
   * ADD DOCS
   */
  #get_matching_list(value) {
    if (!value) return [];

    // Make sure only matching items are included
    // (this is already done in get_list() but not when the list isn't dynamic)
    const list = this.get_config("typeahead").list;
    return CN_common.is_array(list) ? this.get_config("typeahead").list.filter(
      item => item.value.match(new RegExp(RegExp.escape(value), "i"))
    ) : [];
  }
}
