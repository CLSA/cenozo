import { CN_action_view } from "../action/view.mjs"
import { CN_base_model } from "./base_model.mjs"
import { CN_session } from "../session.mjs"

export class CN_model_study_phase_status extends CN_base_model {
  constructor() {
    super({
      wording: {
        singular: "study phase status",
        plural: "study phase statuses",
        posessive: "study phase status'",
      },
      columns: {
        uid: { column: "participant.uid", title: "Participant" },
        study: {
          column: "study.name",
          title: "Study",
          is_hidden: () => "study_phase" == CN_session.get_leaf_model().get_name(),
        },
        study_phase: { column: "study_phase.name", title: "Phase" },
        status: { title: "Status" },
        detail: { title: "Detail" },
      },
      get_default_order: () => {
        return (
          "study_phase" == CN_session.get_leaf_model().get_name() ?
          "uid" :
          ["study.name", "study_phase.rank"]
        );
      },
      properties: {
        uid: { title: "Participant", meta: { table: "participant", column: "uid" }, is_constant: () => true },
        study: { title: "Study", meta: { table: "study", column: "name" }, is_constant: () => true },
        study_phase: { title: "Phase", meta: { table: "study_phase", column: "name" }, is_constant: () => true },
        status: { title: "Status" },
        detail: { title: "Detail" },
        note: { title: "Note", type: "text" },
        participant_id: { is_hidden: () => true },
        study_id: { meta: { table: "study_phase", column: "study_id" }, is_hidden: () => true },
        study_phase_id: { is_hidden: () => true },
      },
    });
  }
}

export class CN_view_study_phase_status extends CN_action_view {
  #view_participant_btn_el;
  #view_study_phase_btn_el;

  /**
   * Extends the parent method
   */
  set_disabled(disabled) {
    super.set_disabled(disabled);
    this.constructor.set_disabled(this.#view_participant_btn_el, disabled);
    this.constructor.set_disabled(this.#view_study_phase_btn_el, disabled);
  }

  /**
   * Extends the parent method
   */
  _create_footer_element() {
    const footer_el = super._create_footer_element();

    // add a view-participant button when the parent model isn't the participant
    const parent_model = this.get_model().get_parent_model();
    const right_btn_group_el = footer_el.querySelector("div[name=right-btn-group]");
    if (null == parent_model || "participant" != parent_model.get_name()) {
      this.#view_participant_btn_el = this.constructor.html(
        '<button name="view-participant" type="button" class="btn btn-primary">View Participant</button>'
      );
      right_btn_group_el.prepend(this.#view_participant_btn_el);
      this.#view_participant_btn_el.addEventListener("click", () => {
        CN_session.navigate_to(
          `participant/view/${this.get_property_value_for_record("participant_id")}`,
          { tab: "study_phase_status" },
        );
      });
    }

    // add a view-study-phase button when the parent model isn't the study_phase
    if (null == parent_model || "study_phase" != parent_model.get_name()) {
      this.#view_study_phase_btn_el = this.constructor.html(
        '<button name="view-study_phase" type="button" class="btn btn-primary">View Study Phase</button>'
      );
      right_btn_group_el.append(this.#view_study_phase_btn_el);
      this.#view_study_phase_btn_el.addEventListener("click", () => {
        const study_id = this.get_property_value_for_record("study_id");
        const study_phase_id = this.get_property_value_for_record("study_phase_id");
        CN_session.navigate_to(
          `study/view/${study_id}/study_phase/view/${study_phase_id}`,
          { tab: "study_phase_status" },
        );
      });
    }

    return footer_el;
  }
}
