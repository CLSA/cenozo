import { CN_api } from "../api.mjs"
import { CN_base_element } from "./base_element.mjs"
import { CN_common } from "../common.mjs"
import { CN_element_card } from "./card.mjs"
import { CN_element_label } from "./label.mjs"
import { CN_input } from "../input/input.mjs"

/**
 * A class used to create a participant selection element
 * @event selectionchanged: ran when the participant selection has changed
 */
export class CN_element_participant_selection extends CN_base_element {
  #created = false;
  #disabled = false;
  #validated = false;
  #count_el = null;
  #identifier_list_form_input;
  #idtype_list_form_input;
  #confirm_btn_el = null;
  #site_list = [];

  constructor(parent_el = null, config = {}) {
    super(parent_el, {
      ...{
        // default config
        path: "participant",
        data: {},
      },
      ...config,
    });
  }

  /**
   * Extend parent method
   */
  update_element() {
    super.update_element();

    if (this.#created) {
      this.#identifier_list_form_input.set_disabled(this.#disabled);
      this.#idtype_list_form_input.set_disabled(this.#disabled);

      // the confirm button is only enabled when the identifier list is not empty
      this.constructor.set_disabled(
        this.#confirm_btn_el,
        this.#disabled || null == this.#identifier_list_form_input.get_value()
      );
    }
  }

  /**
   * Extend parent method
   */
  _create_element() {
    const element = super._create_element();

    const identifier_list_id = (
      this.has_config("unique_id") ?
      `${this.get_config("unique_id")}-identifier_list` :
      "identifier_list"
    );

    const idtype_list_id = (
      this.has_config("unique_id") ?
      `${this.get_config("unique_id")}-idtype_list` :
      "idtype_list"
    );

    const card = CN_element_card.append(element, {
      header: this.constructor.html(`
        <div class="d-flex">
          <div class="flex-grow-1">Participant Selection</div>
          <div name="count" class="fw-normal">(unconfirmed)</div>
        </div>
      `),
      body: "",
      footer: this.constructor.html('<div class="row"></div>'),
    });
    this.#count_el = element.querySelector("div[name=count]");

    const card_body_el = card.get_element().querySelector(".card-body");
    this.#identifier_list_form_input = CN_input.create_input("text", card_body_el, {
      id: identifier_list_id,
      rows: 5,
      on_input: () => {
        this.#count_el.innerHTML = `(unconfirmed)`;
        this.update_element();

        if (this.#validated) {
          this.#validated = false;
          this.run_event_listeners("selectionchanged");
        }
      },
    });
    card_body_el.append(this.#identifier_list_form_input.get_element());

    element.querySelector("div.card-body").classList.add("p-0");

    // add the identifier-type list and confirm button
    this.#confirm_btn_el = this.constructor.html(
      '<button name="confirm" type="button" class="btn btn-primary ms-2">Confirm List</button>'
    );
    this.constructor.disable(this.#confirm_btn_el);

    const row_el = element.querySelector("div.row");
    CN_element_label.append(row_el, {
      for: idtype_list_id,
      value: "Identifier",
      class: "col-sm-3",
    });
    this.#idtype_list_form_input = CN_input.create_input("enum", row_el, {
      id: idtype_list_id,
      class: "d-flex align-items-center col-sm-9",
      required: false,
      placeholder: "UID",
      on_change: () => this.reset_confirmation(),
      // add the confirm button as a postfix to the identifier-type selector
      postfix: (el) => el.append(this.#confirm_btn_el),
      enum: {
        get_enums: async () => {
          const list = await CN_api.get("identifier", {
            select: { column: ["id", "name", "regex"] },
            modifier: { order: "name" },
          });

          return list.map(idtype => ({ key: idtype.id, value: idtype.name, regex: idtype.regex }));
        },
      },
    });
    row_el.append(this.#idtype_list_form_input.get_element());

    // confirm the identifier list with the server
    this.#confirm_btn_el.addEventListener(
      "click",
      async () => {
        const idtype_id = this.get_idtype();

        // create the selected identifier-type's regex (if one exists)
        let re = null;
        if (idtype_id) {
          const regex = this.#idtype_list_form_input.get_config("enum").values.find(
            idtype => idtype_id === idtype.key
          ).regex;
          if (regex) re = new RegExp(regex);
        }

        const data = {
          ...this.get_config("data"),
          identifier_id: idtype_id,
          identifier_list: this.#identifier_list_form_input.get_value()
            .toUpperCase()
            // replace whitespace and separation chars with a space
            .replace(/[\s,;|\/]/g, " ")
            // remove extra space
            .replace(/ +/g, " ")
            // remove anything that isn't a letter, number, underscore or space
            .replace(/[^a-zA-Z0-9_ ]/g, "")
            // delimite string by spaces and create array from result
            .split(" ")
            // match the identifier-type's regex
            .filter(identifier => null == re || null != identifier.match(re))
            // make array unique
            .filter((identifier, index, array) => index <= array.indexOf(identifier))
            .sort(),
        };

        // disable until the operation is complete
        this.set_disabled(true);

        this.#validated = false;
        this.run_event_listeners("selectionchanged");

        // confirm with the server which identifiers are valid
        try {
          const response = await CN_api.post(this.get_config("path"), data);

          // note that the response may be an array or an object containing idtype_list and site_list props
          let identifier_list = [];
          this.#site_list = [];
          if (CN_common.is_object(response)) {
            identifier_list = response.identifier_list;
            this.#site_list = response.site_list;
          } else {
            identifier_list = response;
          }

          await this.#identifier_list_form_input.set_value(identifier_list.join(" "));
          this.#count_el.innerHTML = `(${identifier_list.length} selected)`;

          this.#validated = true;
          this.run_event_listeners("selectionchanged");
        } finally {
          this.set_disabled(false);
        }
      },
    );

    this.#created = true;
    this.reset();

    return element;
  }

  /**
   * Resets the confirmation of the selection back (does not remove the identifier list)
   */
  reset_confirmation() {
    this.#validated = false;
    this.run_event_listeners("selectionchanged");
    if (this.#created) this.#count_el.innerHTML = "(unconfirmed)";
  }

  /**
   * Resets the selection to its initial state
   */
  async reset() {
    this.reset_confirmation();
    if (this.#created) await this.#identifier_list_form_input.set_value(null);
    this.update_element();
  }

  /**
   * Returns whether the participant-selection's UI elements are disabled
   * @return boolean
   */
  get_disabled() {
    return this.#disabled;
  }

  /**
   * Sets whether to disable the participant-selection's UI elements
   * @param boolean disabled
   */
  set_disabled(disabled) {
    this.#disabled = disabled;
    this.update_element();
  }

  /**
   * Access methods
   */
  get_identifier_list() {
    const str = this.#identifier_list_form_input.get_value();
    return this.#validated && 0 < str.length ? str.split(" ") : [];
  }
  get_site_list() { return this.#site_list; }
  get_idtype() {
    const idtype = this.#idtype_list_form_input.get_value();
    return "" === idtype ? null : idtype;
  }
}
