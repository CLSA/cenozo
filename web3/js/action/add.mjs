import { CN_action_base_record } from "./base_record.mjs"
import { CN_api } from "../api.mjs"
import { CN_common } from "../common.mjs"
import { CN_session } from "../session.mjs"

export class CN_action_add extends CN_action_base_record {
  #default_values_applied = [];
  #submit_btn_el;
  #cancel_btn_el;

  /**
   * Constructor
   *
   * @param base_model model: The model that the action belongs to
   */
  constructor(parent_el, model) {
    super("add", parent_el, model);
  }

  /**
   * Extends the parent method
   */
  async get_text(type) {
    if ("crumb" == type) {
      return `Add ${CN_common.uc_words(this.get_model().get_singular())}`;
    }

    if ("header" == type) {
      let text = `Add ${CN_common.uc_words(this.get_model().get_singular())}`;
      const parent_model = this.get_model().get_parent_model();
      if (parent_model) text += ` to ${CN_common.uc_words(parent_model.get_singular())}`;
      return text;
    }

    if ("submit" == type) {
      return "Submit";
    }

    if ("cancel" == type) {
      return "Cancel";
    }

    return await super.get_text(type);
  }

  /**
   * Extend parent method
   */
  set_disabled(disabled) {
    super.set_disabled(disabled);

    this.constructor.set_disabled(this.#submit_btn_el, disabled);
    this.constructor.set_disabled(this.#cancel_btn_el, disabled);
  }
  /**
   * Commits a property's UI value to the state
   * @param string prop_name
   * @param boolean run: Whether to run the action after the operation is complete
   */
  async on_set_property(prop_name, run = false) {
    this.get_property(prop_name).form_input.commit_value();

    if (run) await this.run();
  }

  /**
   * Validates all properties before submitting the new record to the server
   */
  async validate() {
    let valid = true;

    // validate all visible properties setting valid to false if any fail
    await Promise.all(
      this.get_all_properties()
        .filter(prop => !prop.is_hidden(this.get_model()))
        .map(prop => (async () => {
          if (!(await prop.form_input.validate())) valid = false;
        })())
    );

    return valid;
  }

  /**
   * Validates all properties and creates a new record on the server side
   */
  async on_submit() {
    if (!(await this.validate())) return;

    this.set_disabled(true);

    // build the record making sure to resolve any record values that are promises
    let record = {};
    await Promise.all(
      this.get_all_properties()
        .filter(prop => !prop.is_hidden(this.get_model()))
        .map(prop => (async () => {
          record[prop.name] = await Promise.resolve(this.get_property_value_for_record(prop.name));
        })())
    );

    try {
      // run the pre-submit method, post the new record, then send the result to the post-submit method
      await this.on_pre_submit(record);
      await this.on_post_submit(await CN_api.post(this.get_model().get_base_path("api"), record));
    } catch (error) {
      if (CN_common.is_uri_error(error, 409)) {
        JSON.parse(error.body).forEach(prop_name => {
          this.get_property(prop_name).form_input.show_error("Conflicts with existing record", 0);
        });
      } else {
        throw error;
      }
    } finally {
      this.set_disabled(false);
    }
  }

  /**
   * Runs before submitting the record
   * @param object record: The record which will be submitted to the server
   */
  async on_pre_submit(record) {}

  /**
   * Runs after submitting the record
   * @param mixed response: The response returned from posting the record to the server (usually the new ID)
   */
  async on_post_submit(response) {
    const model = this.get_model();
    const parent_model = model.get_parent_model();
    if (parent_model) {
      // go back to the parent
      await CN_session.navigate_to(parent_model.get_view_url(), { tab: model.get_name() });
    } else {
      await CN_session.navigate_to(model.allow_view() ? model.get_view_url(response) : model.get_list_url());
    }
  }

  /**
   * Update's a property's element, applying default values when first called
   * @param string prop_name
   */
  update_property_element(prop_name) {
    const prop = this.get_property(prop_name);
    prop.form_input.update();
  }

  /**
   * Extends parent method
   */
  _create_header_element() {
    const el = super._create_header_element();

    // remove the refresh button
    el.querySelector("[name=refresh]").remove();

    return el;
  }

  /**
   * Extends parent method
   */
  _create_footer_element() {
    const footer_el = this.constructor.html(`
      <div class="d-flex w-100">
        <div class="me-auto btn-group" role="group" name="left-btn-group"></div>
        <div class="btn-group" role="group" name="right-btn-group"></div>
      </div>
    `);
    const right_btn_group_el = footer_el.querySelector("div[name=right-btn-group]");

    this.#cancel_btn_el = this.constructor.html(
      '<button name="cancel" type="button" class="btn btn-light">Cancel</button>'
    );
    right_btn_group_el.append(this.#cancel_btn_el);
    (async () => { this.#cancel_btn_el.innerHTML = await this.get_text("cancel"); })();
    this.#cancel_btn_el.addEventListener("click", this.on_navigate_to_parent.bind(this));

    this.#submit_btn_el = this.constructor.html(
      '<button name="submit" type="button" class="btn btn-primary">Submit</button>'
    );
    right_btn_group_el.append(this.#submit_btn_el);
    (async () => { this.#submit_btn_el.innerHTML = await this.get_text("submit"); })();
    this.#submit_btn_el.addEventListener("click", this.on_submit.bind(this));

    return footer_el;
  }
}
