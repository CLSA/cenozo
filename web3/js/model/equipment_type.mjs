import { CN_base_model } from "../base_model.mjs"

export class CN_equipment_type_model extends CN_base_model {
  constructor() {
    super({
      wording: {
        singular: "equipment type",
        plural: "equipment types",
        posessive: "equipment type's",
      },
      columns: {
        name: { title: "Name" },
        equipment_count: { title: "Inventory", type: "number" },
        equipment_new_count: { title: "new", type: "number" },
        equipment_loaned_count: { title: "loaned", type: "number" },
        equipment_returned_count: { title: "returned", type: "number" },
        equipment_lost_count: { title: "lost", type: "number" },
        description: { title: "Description", align: "left" },
      },
      properties: {
        name: { title: "Name", format: "identifier" },
        regex: { title: "Format" },
        description: { title: "Description", type: "text" },
      },
    });
  }
}

// TODO: implement "Upload Data" extra view operation
