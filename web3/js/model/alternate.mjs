import CN_api from "../api.mjs"

import { CN_base_person_model, CN_base_person_view, CN_base_person_history, CN_base_person_notes }
  from "../base_person_model.mjs"
import { CN_participant_model } from "./participant.mjs"

export class CN_alternate_model extends CN_base_person_model {
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
      properties: {
        participant_id: {
          title: "Participant",
          type: "typeahead",
          typeahead: CN_participant_model.get_typeahead(),
        },
        active: { title: "Active", type: "boolean" },
        first_name: { title: "First Name" },
        last_name: { title: "Last Name" },
        association: {
          title: "Association",
          regex: "^[^0-9]*[0-9]?[^0-9]*$",
          help:
            "How the alternate knows the participant (son, neighbour, wife, etc). " +
            "DO NOT include phone numbers.",
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
        email: { title: "Email", type: "email" },
        email2: { title: "Alternate Email", type: "email" },
        alternate_type_id: {
          meta: {}, // predefined by the service
          title: "Specific Role",
          type: "enum",
          enum: { path: "alternate_type" },
          help: "You can add more than one role after the alternate has been created.",
          is_hidden: (model) => "view" == model.get_action_name(),
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

export class CN_alternate_view extends CN_base_person_view {
  /**
   * Extends the parent method
   */
  async get_text(type) {
    if (["crumb", "name"].includes(type)) {
      return [
        this.get_property_value("last_name"),
        this.get_property_value("first_name"),
      ].join(", ");
    }
    return await super.get_text(type);
  }
}

export class CN_alternate_history extends CN_base_person_history {}

export class CN_alternate_notes extends CN_base_person_notes {}
