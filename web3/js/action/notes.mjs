import { CN_api } from "../api.mjs"
import { CN_base_action } from "./base_action.mjs"
import { CN_common } from "../common.mjs"
import { CN_element_label } from "../element/label.mjs"
import { CN_input_string } from "../input/string.mjs"
import { CN_input_text } from "../input/text.mjs"
import { CN_modal_confirm } from "../modal/confirm.mjs"
import { CN_session } from "../session.mjs"

export class CN_action_notes extends CN_base_action {
  #search_input = null;
  #note_list = [];
  #note_module_name = "note";

  /**
   * Constructor
   * @param base_model model: The model the action belongs to
   */
  constructor(parent_el, model) {
    super("notes", parent_el, model);

    this.set_footer_at_top(true);
  }

  // Getters and setters
  get_note_module_name() { return this.#note_module_name; }
  set_note_module_name(name) { this.#note_module_name = name; }

  /**
   * ADD DOCS
   */
  get_note_url() {
    return `${this.get_model().get_view_url(null, "api")}/${this.#note_module_name}`;
  }

  /**
   * Extend parent method
   */
  async get_text(type) {
    const model = this.get_model();

    if (["crumb", "name"].includes(type)) {
      await this.after_first_load();

      const name = this.get_property_value("name");
      if (name) return name;

      const title = this.get_property_value("title");
      if (title) return title;

      return CN_common.uc_words(model.get_singular());
    }

    if ("header" == type) {
      return `${CN_common.uc_words(model.get_singular())} Details`;
    }

    return await super.get_text(type);
  }

  /**
   * Extend parent method
   */
  async on_navigate_to_parent() {
    await CN_session.navigate_to(this.get_model().get_view_url());
  }

  /**
   * Extend parent method
   */
  async on_load() {
    await super.on_load();

    // load all notes
    this.#note_list = await CN_api.get(this.get_note_url(), {
      select: { column: [
          "id", "sticky", "datetime", "note",
          {table: "user", column: "first_name"},
          {table: "user", column: "last_name"},
      ], },
      modifier: { order: [{ sticky: true }, { datetime: true }] },
    });
  }

  /**
   * Extend parent method
   */
  update_element() {
    super.update_element();

    // determine note permissions
    const note_module = CN_session.get_module(this.#note_module_name);
    const allow_delete = note_module.action_allowed("delete");
    const allow_edit = note_module.action_allowed("edit");

    // only proceed if the note search input has been created
    if (null == this.#search_input) return;

    let search = this.#search_input.get_value();
    if (null == search) search = "";
    const note_list_el = this.get_element().querySelector("[name=note-list]");
    note_list_el.innerHTML = "";
    this.#note_list.filter(note => note.note.includes(search)).forEach(note => {
      const note_path = `${this.get_note_url()}/${note.id}`;
      let details = `${note.first_name} ${note.last_name}<br/>`;
      if (allow_edit) {
        details = `
          <button
            name="sticky"
            type="button"
            class="btn btn-${note.sticky ? "warning" : "secondary"} px-1 py-0 me-1"
          ><i class="bi bi-pin-fill"></i></button>
          ${details}
        `;
      }

      if (allow_delete) {
        details += `
          <button
            name="delete"
            type="button"
            class="btn btn-danger px-1 py-0 me-1"
          ><i class="bi bi-x-lg"></i></button>
        `;
      }
      details += `${CN_common.format_datetime(note.datetime, "datetimesecond")}`;

      const note_el = this.constructor.html(`
        <div class="card">
          <div class="card-body row p-2">
            <div class="col-4 ${note.sticky ? "text-primary fw-bold" : ""}">${details}</div>
            <div class="col-8" name="note"></div>
          <div>
        <div>
      `);
      note_list_el.append(note_el);

      if (allow_edit) {
        note_el.querySelector("[name=sticky]").addEventListener("click", async () => {
          await CN_api.patch(note_path, { sticky: !note.sticky });
          await this.run();
        });

        note_el.querySelector("[name=delete]").addEventListener("click", async () => {
          const modal = new CN_modal_confirm({
            title: "Please Confirm",
            message: `Are you sure you wish to delete the note by ${note.first_name} ${note.last_name}?`,
          });

          if (await modal.open()) {
            await CN_api.delete(note_path);
            await this.run();
          }
        });
      }

      CN_input_text.append(note_el.querySelector("[name=note]"), {
        id: `note-${note.id}`,
        required: true,
        disabled: !allow_edit,
        get_default: () => note.note,
        on_change: async (form_input, valid) => {
          if (valid) {
            await CN_api.patch(note_path, { note: form_input.get_value() });
            form_input.flash_border();
          } else {
            form_input.undo_value(true);
          }
        },
      });
    });
  }

  /**
   * Extend parent method
   */
  _create_placeholder_element() {
    const card_list = CN_common.get_list_of_numbers(10).map(() => `
      <div class="card">
        <div class="card-body row p-2">
          <div class="col-4 placeholder-glow">
            <span class="placeholder placeholder-lg col-${Math.ceil(Math.random()*3)+4}"></span><br/>
            <span class="placeholder placeholder-lg col-${Math.ceil(Math.random()*3)+2}"></span>
          </div>
          <div class="col-8 placeholder-glow">
            <span class="placeholder placeholder-lg col-12"></span>
            <span class="placeholder placeholder-lg col-12"></span>
            <span class="placeholder placeholder-lg col-12"></span>
            <span class="placeholder placeholder-lg col-${Math.ceil(Math.random()*6)+6}"></span>
          </div>
        </div>
      </div>
    `);

    return this.constructor.html(`<div name="note-list" class="container-fluid">${card_list.join("")}</div>`);
  }

  /**
   * Extend parent method
   */
  _create_body_element() {
    const body_el = this.constructor.html(`
      <div>
        <div name="note_add" class="container-fluid px-0">
          <div class="card">
            <div class="card-header text-bg-secondary fw-bold fs-5">Add Note</div>
            <div class="card-body p-0"></div>
            <div class="card-footer p-0">
              <button name="add" type="button" class="btn btn-primary rounded-top-0 w-100">Submit</button>
            </div>
          </div>
        </div>
        <div name="search" class="row my-3"></div>
        <div name="note-list" class="container-fluid px-0"></div>
      </div>
    `);

    const card_body_el = body_el.querySelector(".card-body");

    const new_note_input = new CN_input_text(card_body_el, { id: "new_note" });
    card_body_el.append(new_note_input.get_element());
    body_el.querySelector("[name=add]").addEventListener("click", async () => {
      await CN_api.post(this.get_note_url(), {
        user_id: CN_session.get("user", "id"),
        datetime: CN_common.format_datetime(new Date(), "record"),
        note: new_note_input.get_value(),
      });
      new_note_input.set_value("");
      await this.run();
    });

    // add the search field
    const search_div_el = body_el.querySelector("div[name=search]");
    CN_element_label.append(search_div_el, { for: "search", value: "Search", class: "col-sm-2" });
    this.#search_input = new CN_input_string(search_div_el, {
      id: "search",
      class: "col-sm-10",
      get_default: () => this.get_query_parameter("search"),
      on_input: async (form_input) => {
        this.set_query_parameter("search", form_input.get_value());
        this.update_element();
      },
    });
    search_div_el.append(this.#search_input.get_element());

    return body_el;
  }

  /**
   * Convenience method used by the _create_footer_element() and _create_topfooter_element() methods
   * @param element el
   */
  _create_all_footer_elements(el) {
    // wire up the buttons
    const back_btn_el = el.querySelector("button[name=back]");
    back_btn_el.addEventListener("click", this.on_navigate_to_parent.bind(this));
  }

  /**
   * Extend parent method
   */
  _create_footer_element() {
    const footer_el = this.constructor.html(`
      <div class="d-flex w-100">
        <div class="me-auto btn-group" role="group" name="left-btn-group"></div>
        <div class="btn-group" role="group" name="right-btn-group">
          <button name="back" type="button" class="btn btn-primary">
            View ${CN_common.uc_words(this.get_model().get_singular())}
          </button>
        </div>
      </div>
    `);

    this._create_all_footer_elements(footer_el);

    return footer_el;
  }

  /**
   * Extend parent method
   */
  _create_topfooter_element() {
    // no need to create the top-footer as it gets cloned from the footer
    const topfooter_el = super._create_topfooter_element();
    this._create_all_footer_elements(topfooter_el);
    return topfooter_el;
  }
}
