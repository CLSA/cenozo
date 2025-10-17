import CN_api from "../api.mjs"

import { CN_base_model } from "../base_model.mjs"
import { CN_participant_model } from "./participant.mjs"

export class CN_participant_identifier_model extends CN_base_model {
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
          is_constant: (model) => "view" == model.get_action_name(),
        },
        participant_id: {
          column: "participant_identifier.participant_id",
          title: "Participant",
          type: "typeahead",
          typeahead: CN_participant_model.get_typeahead(),
        },
        value: {
          title: "Value",
          format: "identifier",
          is_constant: (model) => {
            return (
              "view" == model.get_action_name() ?
              model.get_action().get_property("locked").state.get() :
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

// TODO: implement "Import Participant Identifiers" extra view operation
