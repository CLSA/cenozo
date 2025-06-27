import { CN_base_model } from "../base_model.mjs"

export class CN_equipment_model extends CN_base_model {
  constructor() {
    super({
      wording: {
        singular: "equipment",
        plural: "equipments",
        posessive: "equipment's",
      },
      columns: {
        equipment_type: {
          column: "equipment_type.name",
          title: "Type",
        },
        active: {
          title: "Active",
          type: "boolean",
        },
        site: {
          column: "site.name",
          title: "Site",
        },
        serial_number: {
          title: "SN",
        },
        status: {
          title: "Status",
        },
        uid: {
          column: "participant.uid",
          title: "On Loan",
        },
        note: {
          column: "equipment.note",
          title: "Note",
          type: "text",
        },
      },
      // TODO: define properties
    });
  }
}
