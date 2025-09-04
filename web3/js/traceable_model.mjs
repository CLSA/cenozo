import CN_api from "./api.mjs"
import CN_common from "./common.mjs"
import CN_element from "./element.mjs"
import CN_session from "./session.mjs"

import { CN_base_add } from "./base_add.mjs"
import { CN_base_list } from "./base_list.mjs"
import { CN_base_model } from "./base_model.mjs"
import { CN_base_view } from "./base_view.mjs"

export class CN_traceable_model extends CN_base_model {
  async add_trace(trace_reason) {
    if (CN_common.is_string(trace_reason)) {
      // this happens after redirecting the browser, so don't await
      await CN_api.patch(`participant/${this.get_parent_model().get_identifier()}`, {
        explain_last_trace: {
          user_id: CN_session.data.user.id,
          site_id: CN_session.data.site.id,
          role_id: CN_session.data.role.id,
          application_id: CN_session.data.application.id,
          note: trace_reason,
        }
      });
    }
  }
}

export class CN_traceable_add extends CN_base_add {
  #trace_reason;

  /**
   * Extends the parent method
   */
  async validate() {
    // only test participants for tracing
    const parent_model = this.get_model().get_parent_model();
    if ("participant" != parent_model.get_name()) return await super.validate();

    this.#trace_reason = null;
    let valid = await super.validate();
    if (valid) {
      this.#trace_reason = await CN_element.check_for_trace(
        this.get_model().get_name(),
        "added",
        parent_model.get_identifier()
      );
      if (false === this.#trace_reason) valid = false;
    }

    return valid;
  }

  async on_submit() {
    await super.on_submit();

    // only test participants for tracing
    const parent_model = this.get_model().get_parent_model();
    if ("participant" != parent_model.get_name()) return;

    // if a reason was given then update the participant with a new trace
    this.get_model().add_trace(this.#trace_reason);
    this.#trace_reason = null;
  }
}

export class CN_traceable_list extends CN_base_list {
  /**
   * Extends the parent method
   */
  async on_delete(record) {
    // only test participants for tracing
    const parent_model = this.get_model().get_parent_model();
    if ("participant" != parent_model.get_name()) return await super.on_delete(record);

    // first confirm
    const modal = CN_element.confirm_modal({
      static: true,
      title: "Please Confirm",
      message: `Are you sure you wish to delete the ${this.get_model().get_singular()} record?`,
    });

    if (await modal.test()) {
      // now get the reason for the trace and apply it
      let trace_reason = await CN_element.check_for_trace(
        this.get_model().get_name(),
        "removed",
        parent_model.get_identifier()
      );
      if (trace_reason) {
        await CN_api.delete(`${this.get_model().get_name()}/${record.id}`);
        await this.run();
        this.get_model().add_trace(trace_reason);
      }
    }
  }
}

export class CN_traceable_view extends CN_base_view {
  /**
   * Extends the parent method
   */
  async on_set_property(prop_name) {
    // only test participants for tracing
    const parent_model = this.get_model().get_parent_model();
    if ("active" != prop_name || "participant" != parent_model.get_name()) {
      return await super.on_set_property(prop_name);
    }

    let trace_reason = await CN_element.check_for_trace(
      this.get_model().get_name(),
      await this.get_formatted_property(prop_name) ? "added" : "removed",
      parent_model.get_identifier()
    );

    if (trace_reason) {
      // if a reason was given then update the participant with a new trace
      await super.on_set_property(prop_name);
      this.get_model().add_trace(trace_reason);
    } else {
      this.get_property(prop_name).state.undo();
      this.run();
    }
  }

  /**
   * Extends the parent method
   */
  async on_delete() {
    // only test participants for tracing
    const parent_model = this.get_model().get_parent_model();
    if ("participant" != parent_model.get_name()) return await super.on_delete(record);

    // first confirm
    const modal = CN_element.confirm_modal({
      static: true,
      title: "Please Confirm",
      message: `Are you sure you wish to delete this ${this.get_model().get_singular()}?`,
    });

    if (await modal.test()) {
      // now get the reason for the trace and apply it
      let trace_reason = await CN_element.check_for_trace(
        this.get_model().get_name(),
        "removed",
        parent_model.get_identifier()
      );
      if (trace_reason) {
        await CN_api.delete(this.get_model().get_view_url(null, "api"));
        await this.on_navigate_to_parent();
        this.get_model().add_trace(trace_reason);
      }
    }
  }
}
