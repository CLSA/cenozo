import { CN_api } from "../api.mjs"
import { CN_base_model } from "./base_model.mjs"
import { CN_participant_model } from "./participant.mjs"
import { CN_session } from "../session.mjs"

export class CN_equipment_model extends CN_base_model {
  constructor() {
    super({
      wording: {
        singular: "equipment",
        plural: "equipments",
        posessive: "equipment's",
      },
      columns: {
        equipment_type: { column: "equipment_type.name", title: "Type" },
        active: { title: "Active", type: "boolean" },
        site: { column: "site.name", title: "Site" },
        serial_number: { title: "Serial Number" },
        status: { title: "Status" },
        uid: { column: "participant.uid", title: "On Loan" },
        note: { column: "equipment.note", title: "Note", type: "text" },
      },
      get_default_order: () => "serial_number",
      properties: {
        equipment_type_id: {
          title: "Equipment Type",
          type: "enum",
          enum: { path: "equipment_type" },
          is_constant: (model) => "view" == model.get_action_name(),
        },
        active: {
          title: "Active",
          type: "boolean",
          help: 'Only active equipment can be selected by Pine\'s equipment type questions.',
        },
        site_id: {
          title: "Site",
          type: "enum",
          enum: { path: "site" },
          is_hidden: (model) => !CN_session.get("role", "all_sites") || "site" == model.get_parent_model().get_name(),
        },
        serial_number: { title: "Serial Number", format: "identifier" },
        status: {
          title: "Status",
          is_constant: () => true,
          is_hidden: (model) => "add" == model.get_action_name(),
          help: 'Will show "new" if never loaned out, "loaned" if currently on loan, "returned" if ready to re-distribute, and "lost" if never returned.',
        },
        participant_id: {
          meta: { table: "participant", column: "id" },
          title: "On Loan To",
          type: "typeahead",
          typeahead: CN_participant_model.get_typeahead(),
          is_constant: () => true,
          is_hidden: (model) => "add" == model.get_action_name(),
        },
        note: { title: "Note", type: "text" }
      },
    });
  }

  /**
   * Returns a typeahead object for models that have a typeahead property referencing this model
   * @return object
   * @static
   */
  static get_typeahead() {
    return {
      get_list: async (value) => {
        return await CN_api.get("equipment", {
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
            order: 'CONCAT( equipment_type.name, ": ", equipment.serial_number )',
            limit: 20,
          },
        });
      },
    };
  }
}
