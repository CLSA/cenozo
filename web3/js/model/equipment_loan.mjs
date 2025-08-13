import CN_api from "../api.mjs"

import { CN_base_model } from "../base_model.mjs"

export class CN_equipment_loan_model extends CN_base_model {
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
          typeahead: {
            get_list: async (value) => {
              const response = await CN_api.get("participant", {
                select: {
                  column: [{
                    table: "participant",
                    column: "id",
                    alias: "key",
                  }, {
                    table: "participant",
                    column: 'CONCAT( participant.first_name, " ", participant.last_name, " (", uid, ")" )',
                    alias: "value",
                    table_prefix: false,
                  }],
                },
                modifier: {
                  where: [
                    { column: "uid", operator: "like", value: `%${value}%` },
                    { column: "first_name", operator: "like", value: `%${value}%`, or: true },
                    { column: "last_name", operator: "like", value: `%${value}%`, or: true },
                  ],
                  order: 'CONCAT( participant.first_name, " ", participant.last_name, " (", uid, ")" )',
                },
              });
              return (await response.json());
            },
          },
          is_constant: (model) => "view" == model.get_action_name(),
        },
        equipment_id: {
          title: "Serial Number",
          type: "typeahead",
          typeahead: {
            get_list: async (value) => {
              const response = await CN_api.get("equipment", {
                select: {
                  column: [{
                    table: "equipment",
                    column: "id",
                    alias: "key",
                  }, {
                    table: "equipment",
                    column: 'CONCAT( equipment_type.name, ": ", equipment.serial_number )',
                    alias: "value",
                    table_prefix: false,
                  }],
                },
                modifier: {
                  where: {
                    column: "equipment.serial_number",
                    operator: "like",
                    value: `%${value}%`,
                  },
                  order: 'CONCAT( equipment_type.name, ": ", equipment.serial_number )'
                },
              });
              return (await response.json());
            },
            table: "equipment",
            select: 'CONCAT( equipment_type.name, ": ", equipment.serial_number )',
            where: "equipment.serial_number",
          },
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
          max: "now",
        },
        end_datetime: {
          title: "Return Date & Time",
          type: "datetime",
          max: "now",
          is_hidden: (model) => "add" == model.get_action_name(),
        },
        note: { title: "Note", type: "text" },
      },
    });
  }
}
