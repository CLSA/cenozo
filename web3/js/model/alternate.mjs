import { CN_action_notes } from "../action/notes.mjs"
import { CN_api } from "../api.mjs"
import {
  CN_model_base_person,
  CN_view_base_person,
  CN_history_base_person,
} from "./base_person.mjs"
import { CN_common } from "../common.mjs"
import { CN_model_participant } from "./participant.mjs"
import { CN_session } from "../session.mjs"

export class CN_model_alternate extends CN_model_base_person {
  constructor() {
    super({
      wording: {
        singular: "alternate",
        plural: "alternates",
        posessive: "alternate's",
      },
      columns: {
        uid: { column: "participant.uid", title: "Participant" },
        active: { title: "Active", type: "boolean" },
        first_name: { title: "First Name" },
        last_name: { title: "Last Name" },
        association: { title: "Association" },
        alternate_type_list: { title: "Types", table_prefix: false },
        global_note: { title: "Special Note", type: "text", limit: 100 },
      },
      get_default_order: () => {
        const parent_model = this.get_parent_model();
        return (
          parent_model && "participant" == parent_model.get_name() ?
          "last_name" :
          "uid"
        );
      },
      properties: {
        participant_id: {
          title: "Participant",
          type: "typeahead",
          typeahead: CN_model_participant.get_typeahead(),
        },
        active: { title: "Active", type: "boolean" },
        first_name: { title: "First Name" },
        last_name: { title: "Last Name" },
        association: {
          title: "Association",
          regex: "^[^0-9]*[0-9]?[^0-9]*$",
          help: `
            How the alternate knows the participant (son, neighbour, wife, etc).
            DO NOT include phone numbers.
          `,
        },
        language_id: {
          title: "Preferred Language",
          type: "enum",
          enum: {
            path: "language",
            modifier: {
              where: { column: "active", operator: "=", value: true },
              order: "language.name",
            },
          },
        },
        email: {
          title: "Email",
          type: "email",
          help: 'Must be in the format "account@domain.name".',
        },
        email2: {
          title: "Alternate Email",
          type: "email",
          help: 'Must be in the format "account@domain.name".',
        },
        alternate_type_id: {
          meta: {}, // predefined by the service
          title: "Specific Role",
          type: "enum",
          enum: { path: "alternate_type" },
          help: "You can add more than one role after the alternate has been created.",
          is_hidden: () => "view" == this.get_action_name(),
        },
        global_note: { title: "Special Note", type: "text" },
      },
    });
  }

  /**
   * Only allow adding when the parent model is participant or there is no parent)
   */
  allow_add() {
    const parent_model = this.get_parent_model();
    return super.allow_add() && (null == parent_model || "participant" == parent_model.get_name());
  }

  /**
   * Override the default get_base_path() method when alternate_consent_type is the parent model.
   * This is because there is no direct relationship between alternate and alternate_consent_type.
   */
  get_base_path(type) {
    const parent_model = this.get_parent_model();
    return (
      "url" == type && parent_model && "alternate_consent_type" == parent_model.get_name() ?
      "alternate" :
      super.get_base_path(type)
    );
  }
}

export class CN_view_alternate extends CN_view_base_person {
  #view_participant_btn_el;

  /**
   * Extends the parent method
   */
  async get_text(type) {
    if ("crumb" == type) {
      return `${this.get_property_value("last_name")}, ${this.get_property_value("first_name")}`;
    }

    if ("header" == type) {
      const full_name = [
        this.get_property_value("first_name"),
        this.get_property_value("last_name"),
      ].join(" ");
      return `Alternate Details for ${full_name}`;
    }

    return await super.get_text(type);
  }

  /**
   * Extends the parent method
   */
  set_disabled(disabled) {
    super.set_disabled(disabled);
    this.constructor.set_disabled(this.#view_participant_btn_el, disabled);
  }

  /**
   * Extends the parent method
   */
  _create_footer_element() {
    const footer_el = super._create_footer_element();

    // add a view-participant button when the parent model isn't the participant
    const parent_model = this.get_model().get_parent_model();
    if (null == parent_model || "participant" != parent_model.get_name()) {
      const right_btn_group_el = footer_el.querySelector("div[name=right-btn-group]");
      this.#view_participant_btn_el = this.constructor.html(
        '<button name="view-participant" type="button" class="btn btn-primary">View Participant</button>'
      );
      right_btn_group_el.append(this.#view_participant_btn_el);
      this.#view_participant_btn_el.addEventListener("click", () => {
        CN_session.navigate_to(
          `participant/view/${this.get_property_value_for_record("participant_id")}`,
          { tab: "alternate" },
        );
      });
    }

    return footer_el;
  }
}

export class CN_history_alternate extends CN_history_base_person {}

export class CN_notes_alternate extends CN_action_notes {
  /**
   * Extend parent method
   */
  async get_text(type) {
    const model = this.get_model();

    if ("crumb" == type) {
      const data = await CN_api.get(
        model.get_view_url(null, "api"),
        { select: { column: ["first_name", "last_name"] } },
      );
      return `${data.first_name} ${data.last_name}`;
    }

    if ("header" == type) {
      const data = await CN_api.get(
        model.get_view_url(null, "api"),
        { select: { column: ["first_name", "last_name"] } },
      );
      return (
        CN_common.uc_words(model.get_singular()) +
        ` Notes for ${data.first_name} ${data.last_name}`
      );
    }

    return await super.get_text(type);
  }

  /**
   * Extend parent method
   */
  _create_topfooter_element() {
    const topfooter_el = super._create_topfooter_element();

    // wire-up the history button
    topfooter_el.querySelector("button[name=history]").addEventListener(
      "click",
      () => CN_session.navigate_to(this.get_model().get_history_url()),
    );

    return topfooter_el;
  }

  /**
   * Extend parent method
   */
  _create_footer_element() {
    const footer_el = super._create_footer_element();

    const history_btn_el = this.constructor.html(
      '<button name="history" type="button" class="btn btn-light btn-outline-primary">History</button>'
    );

    // wire-up the history button
    history_btn_el.addEventListener(
      "click",
      () => CN_session.navigate_to(this.get_model().get_history_url()),
    );
    footer_el.querySelector("div[name=left-btn-group]").append(history_btn_el);

    return footer_el;
  }
}
