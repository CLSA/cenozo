import CN_api from "../../api.mjs"
import CN_common from "../../common.mjs"
import CN_element from "../../element.mjs"
import CN_session from "../../session.mjs"

import { CN_action_base_record } from "./base_record.mjs"

export class CN_action_add extends CN_action_base_record {
  #default_values_applied = [];

  /**
   * Constructor
   *
   * @param base_model model: The model that the action belongs to
   */
  constructor(model) {
    super("add", model);
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
   * Commits a property's UI value to the state
   * @param string prop_name
   */
  async on_set_property(prop_name) {
    this.get_property(prop_name).form_input.commit_value();
  }

  /**
   * Validates all properties before submitting the new record to the server
   */
  async validate() {
    let valid = true;

    // validate all visible properties
    this.get_all_properties().forEach(prop => {
      if (!prop.is_hidden(this.get_model()) && !prop.form_input.validate()) valid = false;
    });

    return valid;
  }

  /**
   * Validates all properties and creates a new record on the server side
   */
  async on_submit() {
    const valid = await this.validate();
    if (!valid) return;

    // build the record, running all get_formatted_value() async calls in parallel
    let record = {};
    await Promise.all(
      this.get_all_properties()
        .filter(prop => !prop.is_hidden(this.get_model()))
        .map(prop => (async () => record[prop.name] = await prop.form_input.get_formatted_value())())
    );

    try {
      // run the pre-submit method, post the new record, then send the result to the post-submit method
      await this.on_pre_submit(record);
      await this.on_post_submit(await CN_api.post(this.get_model().get_base_path("api"), record));
    } catch (error) {
      if (409 == error.response.status) {
        JSON.parse(error.body).forEach(prop_name => {
          this.get_property(prop_name).form_input.show_error("Conflicts with existing record", 0);
        });
      } else {
        throw error;
      }
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
      await CN_session.navigate_to(parent_model.get_view_url());
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
  create_header_element() {
    const el = super.create_header_element();

    // remove the refresh button
    el.querySelector("[name=refresh]").remove();

    return el;
  }

  /**
   * Extends parent method
   */
  create_footer_element() {
    const btn_group_el = CN_element.create('<div class="btn-group" role="group"></div>');

    const submit_btn_el = CN_element.create(
      '<button name="submit" type="button" class="btn btn-primary">Submit</button>'
    );
    btn_group_el.append(submit_btn_el);
    (async () => { submit_btn_el.innerHTML = await this.get_text("submit"); })();
    submit_btn_el.addEventListener("click", this.on_submit.bind(this));

    const cancel_btn_el = CN_element.create(
      '<button name="cancel" type="button" class="btn btn-light">Cancel</button>'
    );
    btn_group_el.append(cancel_btn_el);
    (async () => { cancel_btn_el.innerHTML = await this.get_text("cancel"); })();
    cancel_btn_el.addEventListener("click", this.on_navigate_to_parent.bind(this));

    return btn_group_el;
  }
}
