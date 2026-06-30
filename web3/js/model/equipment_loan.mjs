import { CN_base_model } from "./base_model.mjs"
import { CN_common } from "../common.mjs"
import { CN_model_equipment } from "./equipment.mjs"
import { CN_model_participant } from "./participant.mjs"

export class CN_model_equipment_loan extends CN_base_model {
  constructor() {
    super({
      wording: {
        singular: "equipment loan",
        plural: "equipment loans",
        posessive: "equipment loan's",
      },
      columns: {
        uid: { column: "participant.uid", title: "Participant" },
        equipment_type: { column: "equipment_type.name", title: "Equipment Type" },
        serial_number: { column: "equipment.serial_number", title: "Serial Number" },
        lost: { title: "Lost", type: "boolean" },
        start_datetime: { title: "Loan Date & Time", type: "datetime" },
        end_datetime: { title: "Return Date & Time", type: "datetime" },
      },
      properties: {
        participant_id: {
          title: "Participant",
          type: "typeahead",
          typeahead: CN_model_participant.get_typeahead(),
          is_constant: (model) => "view" == model.get_action_name(),
        },
        equipment_id: {
          title: "Serial Number",
          type: "typeahead",
          typeahead: CN_model_equipment.get_typeahead(),
          help: "Type in the serial number of the device (do not include the device type).",
        },
        lost: {
          title: "Lost",
          type: "boolean",
          is_hidden: (model) => "add" == model.get_action_name(),
        },
        start_datetime: {
          title: "Loan Date & Time",
          type: "datetime",
          get_max: () => CN_common.get_date(),
        },
        end_datetime: {
          title: "Return Date & Time",
          type: "datetime",
          get_max: () => CN_common.get_date(),
          is_hidden: (model) => "add" == model.get_action_name(),
        },
        note: { title: "Note", type: "text" },
      },
    });
  }
}
