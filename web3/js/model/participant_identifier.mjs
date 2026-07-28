import { CN_action_add } from "../action/add.mjs"
import { CN_action_list } from "../action/list.mjs"
import { CN_base_model } from "./base_model.mjs"
import { CN_model_participant } from "./participant.mjs"

export class CN_model_participant_identifier extends CN_base_model {
  constructor() {
    super({
      wording: {
        singular: "participant identifier",
        plural: "participant identifiers",
        posessive: "participant identifier's",
      },
      columns: {
        identifier: { column: "identifier.name", title: "Identifier" },
        uid: { column: "participant.uid", title: "UID" },
        value: { title: "Value" },
      },
      properties: {
        identifier_id: {
          column: "participant_identifier.identifier_id",
          title: "Identifier",
          type: "enum",
          enum: { path: "identifier" },
          is_constant: () => "view" == this.get_action_name(),
        },
        participant_id: {
          column: "participant_identifier.participant_id",
          title: "Participant",
          type: "typeahead",
          typeahead: CN_model_participant.get_typeahead(),
        },
        value: {
          title: "Value",
          format: "identifier",
          is_constant: () => {
            return (
              "view" == this.get_action_name() ?
              this.get_action().get_property_value("locked") :
              false
            );
          },
        },
        locked: {
          meta: { table: "identifier", column: "locked" },
          is_hidden: () => true,
        },
      }
    });
  }
}

export class CN_add_participant_identifier extends CN_action_add {
  /**
   * Extend parent method
   */
  async get_text(type) {
    if ("header" == type) {
      return "Create Participant Identifier";
    }
    return await super.get_text(type);
  }
}

export class CN_list_participant_identifier extends CN_action_list {
  /**
   * Extend parent method
   */
  async get_text(type) {
    if ("header" == type) {
      return (
        "identifier" == this.get_model().get_parent_model().get_name() ?
        "Participant List" :
        "participant" == this.get_model().get_parent_model().get_name() ?
        "Identifier List" :
        await super.get_text("header")
      )
    }
    return await super.get_text(type);
  }
}
