import { CN_action_list } from "../action/list.mjs"
import { CN_action_view } from "../action/view.mjs"
import { CN_api } from "../api.mjs"
import { CN_base_model } from "./base_model.mjs"
import { CN_modal_message } from "../modal/message.mjs"
import { CN_session } from "../session.mjs"

export class CN_model_interview extends CN_base_model {
  constructor() {
    super({
      wording: {
        singular: "interview",
        plural: "interviews",
        posessive: "interview's",
      },
      columns: {
        uid: { column: "participant.uid", title: "UID" },
        site: {
          column: "site.name",
          title: "Credited Site",
          is_hidden: () => !CN_session.get("role", "all_sites"),
        },
        start_datetime: { title: "Start", type: "datetimesecond" },
        end_datetime: { title: "End", type: "datetimesecond" },
      },
      properties: {
        uid: {
          meta: { table: "participant", column: "uid" },
          title: "Participant",
          is_constant: () => true,
        },
        site_id: {
          title: "Credited Site",
          type: "enum",
          enum: { path: "site" },
          help: "This determines which site is credited with the completed interview.",
          is_constant: () => 3 > CN_session.get("role", "tier"),
        },
        start_datetime: {
          column: "interview.start_datetime",
          title: "Start Date & Time",
          type: "datetimesecond",
          get_max: (model) => model.get_action().get_property("end_datetime").form_input.get_date(),
          is_constant: () => 3 > CN_session.get("role", "tier"),
          help: "When the first call from the first assignment was made for this interview.",
        },
        end_datetime: {
          column: "interview.end_datetime",
          title: "End Date & Time",
          type: "datetimesecond",
          get_min: (model) => model.get_action().get_property("start_datetime").form_input.get_date(),
          get_max: () => new Date(), // now
          is_constant: () => 3 > CN_session.get("role", "tier"),
          help: "Will remain blank until the questionnaire is finished.",
        },
        note: { column: "interview.note", title: "Note", type: "text" },
        participant_id: { meta: { table: "participant", column: "id" }, is_hidden: () => true },
        effective_site_id: { meta: { table: "effective_site", column: "id" }, is_hidden: () => true },
      },
    });
  }
}

export class CN_list_interview extends CN_action_list {
  /**
   * Extend parent method
   */
  async on_add() {
    // Adding an interview is special, instead of transitioning to an add dialog immediately add a new interview
    try {
      await CN_api.post(this.get_model().get_base_path("api"), {});
    } catch (error) {
      if (409 == error.response.status) {
        await CN_modal_message.create_and_open({
          type: "danger",
          title: "Unable to Add Interview",
          message: `
            ${JSON.parse(error.body)}<br/>
            This is likely caused by the list being out of date so it will now be refreshed.
          `,
        });
      } else {
        throw error;
      }
    }

    await this.run();
  }
}

export class CN_view_interview extends CN_action_view {
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

    return footer_el;
  }
}
