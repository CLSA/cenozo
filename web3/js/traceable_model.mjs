import CN_api from "./api.mjs"
import CN_common from "./common.mjs"
import CN_element from "./element.mjs"
import CN_session from "./session.mjs"
import { CN_modal_confirm } from "./element/modal/confirm.mjs"

import { CN_base_add } from "./base_add.mjs"
import { CN_base_list } from "./base_list.mjs"
import { CN_base_model } from "./base_model.mjs"
import { CN_base_view } from "./base_view.mjs"

/**
 * Pops up an input dialog to get the reason why a participant will be added to or removed from tracing
 * as a result of adding/activating or removing/deactivating either an address or phone number.
 * Note that this function should be called before making the change to the address or phone.
 *
 * If tracing is unaffected true is returned, if tracing is affected but no reason is provided then false
 * is returned, otherwise the reason is returned as a string.
 *
 * @param string type: either "address" or "phone"
 * @param boolean action: either "added" or "removed"
 * @param string subject: either "participant" or "alternate"
 * @param integer identifier: an object with identifer (id) and subject (participant or alternate) properties
 * @param boolean|string True if no tracing is required, false if cancelled, a string if a reason is provided
 * @return boolean|string
 */
async function check_for_trace(type, action, identifier) {
  // sanitize inputs
  if (!["address", "phone"].includes(type)) {
    throw new Error(`First argument for check_for_trace, "${type}", must be either "address" or "phone".`);
  }
  if (!["added", "removed"].includes(action)) {
    throw new Error(`First argument for check_for_trace, "${action}", must be either "added" or "removed".`);
  }

  // Activate tracing if the contact belongs to a participant who only has one valid contact of the
  // requested type (address or phone) and the last trace is null
  let changing_count_column = `active_${type}_count`;
  let other_count_column = `active_${"address" == type ? "phone" : "address"}_count`;

  const data = await CN_api.get(`participant/${identifier}`, {
    select: {
      column: [
        "active_address_count",
        "active_phone_count",
        { table: "trace_type", column: "name", alias: "trace_type" },
      ],
    },
  });

  let response = true;
  if ("removed" == action) {
    // check to see if tracing will be required after removing/deactivating the contact type
    if (1 == data[changing_count_column] && null == data.trace_type) {
      response = await CN_element.input_modal({
        title: "Tracing Required",
        message: `
          If you proceed the participant will no longer have an active ${type}.
          In order to help with tracing, please provide the reason that you are changing the participant's ${type}:
        `,
        required: true,
        input: "string",
      }).get();
    }
  } else {
    // check to see if tracing will be resolved after adding/activating the contact type
    if (0 == data[changing_count_column] && 0 < data[other_count_column] && null != data.trace_type) {
      response = await CN_element.input_modal({
        title: "Tracing Completed",
        message: `
          Before your change the participant did not have an active ${type}.
          Please provide how the new ${type} information was determined:
        `,
        required: true,
        input: "string",
      }).get();
    }
  }

  // if the input_modal was cancelled then the value will be undefined
  return undefined === response ? false : response;
}


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
      this.#trace_reason = await check_for_trace(
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
    const modal = new CN_modal_confirm({
      title: "Please Confirm",
      message: `Are you sure you wish to delete the ${this.get_model().get_singular()} record?`,
    });

    if (await modal.open()) {
      // now get the reason for the trace and apply it
      let trace_reason = await check_for_trace(
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

    let trace_reason = await check_for_trace(
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
    if ("participant" != parent_model.get_name()) return await super.on_delete();

    // first confirm
    const modal = new CN_modal_confirm({
      title: "Please Confirm",
      message: `Are you sure you wish to delete this ${this.get_model().get_singular()}?`,
    });

    if (await modal.open()) {
      // now get the reason for the trace and apply it
      let trace_reason = await check_for_trace(
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
