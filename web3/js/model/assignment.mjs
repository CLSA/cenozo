import { CN_action_view } from "../action/view.mjs"
import { CN_api } from "../api.mjs"
import { CN_base_model } from "./base_model.mjs"
import { CN_common } from "../common.mjs"
import { CN_modal_confirm } from "../modal/confirm.mjs"
import { CN_session } from "../session.mjs"

export class CN_model_assignment extends CN_base_model {
  constructor() {
    super({
      wording: {
        singular: "assignment",
        plural: "assignments",
        posessive: "assignment's",
      },
      columns: {
        uid: {
          column: "participant.uid",
          title: "UID",
          is_hidden: () => "assignment" != CN_session.get_leaf_model().get_name(),
        },
        qnaire_name: {
          title: "Questionnaire",
          is_hidden: () => "assignment" != CN_session.get_leaf_model().get_name(),
          table_prefix: false,
        },
        user: { column: "user.name", title: "User" },
        role: { column: "role.name", title: "Role" },
        site: { column: "site.name", title: "Site", is_hidden: () => !CN_session.get("role", "all_sites") },
        phone_call_count: { title: "Calls", type: "integer", table_prefix: false },
        status: { title: "Status", table_prefix: false },
        start_datetime: { title: "Start", type: "datetimesecond" },
        end_datetime: { title: "End", type: "datetimesecond" },
      },
      properties: {
        participant: {
          meta: { table: "participant", column: "uid" },
          title: "Participant",
          is_constant: () => true,
        },
        user: { meta: { table: "user", column: "name" }, title: "User", is_constant: () => true },
        role: { meta: { table: "role", column: "name" }, title: "Role", is_constant: () => true },
        site: { meta: { table: "site", column: "name" }, title: "Site", is_constant: () => true },
        start_datetime: {
          title: "Start Date & Time",
          type: "datetimesecond",
          get_max: (model) => model.get_action().get_property("end_datetime").form_input.get_date(),
        },
        end_datetime: {
          title: "End Date & Time",
          type: "datetimesecond",
          get_min: (model) => model.get_action().get_property("start_datetime").form_input.get_date(),
          get_max: () => CN_common.get_date(),
        },
        participant_id: { meta: { table: "participant", column: "id" }, is_hidden: () => true },
      },
    });
  }
}

export class CN_view_assignment extends CN_action_view {
  /**
   * Extend parent method
   */
  update_element() {
    super.update_element();

    // only enable the force-close button when the assignment is open
    const close_btn_el = this.get_footer_element().querySelector("button[name=close]");
    if (close_btn_el) {
      this.constructor.set_disabled(close_btn_el, "(empty)" != this.get_property_value("end_datetime"));
    }
  }

  /**
   * Extend parent method
   */
  _create_footer_element() {
    const footer_el = super._create_footer_element();
    const left_btn_group_el = footer_el.querySelector("div[name=left-btn-group]")

    // add the notes action
    const notes_btn_el = this.constructor.html(
      '<button name="notes" type="button" class="btn btn-light btn-outline-primary">Notes</button>'
    );
    notes_btn_el.addEventListener(
      "click",
      () => CN_session.navigate_to(`participant/notes/${this.get_property_value("participant_id")}`)
    );
    left_btn_group_el.append(notes_btn_el);

    // add the close action
    if (1 < CN_session.get("role", "tier")) {
      const close_btn_el = this.constructor.html(
        '<button name="close" type="button" class="btn btn-light btn-outline-primary">Force Close</button>'
      );
      close_btn_el.addEventListener("click", async () => {
        let message = "Are you sure you wish to force-close the assignment?";
        if (CN_session.get("application", "voip_enabled")) {
          message += `
            <br/><br/>Note that this will not disconnect active VoIP calls,
            nor will it prevent the user from continuing to answer questionnaires.
          `;
        }
        const response = await CN_modal_confirm.create_and_open({
          title: "Force Close Assignment?",
          message: message,
        });

        if (response) {
          try {
            await this.constructor.wait_for(CN_api.patch(
              this.get_model().get_view_url(null, "api") + "?operation=force_close",
              {}
            ));
          } catch (error) {
            if (CN_common.is_uri_error(error, 404)) {
              // 404 means the assignment no longer exists, so to back to the parent's view
              await CN_session.transition_to(this.get_model().get_parent_model().get_view_url());
              return
            } else if (CN_common.is_uri_error(error, 409)) {
              // 409 means the assignment is already closed (so wait for the view to run and update
            } else {
              throw error;
            }
          }

          await this.run();
        }
      });
      left_btn_group_el.append(close_btn_el);
    }

    return footer_el;
  }
}
