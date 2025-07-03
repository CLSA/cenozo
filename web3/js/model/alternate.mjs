import CN_api from "../api.mjs"

import { CN_base_model } from "../base_model.mjs"
import { CN_base_view } from "../base_view.mjs"

export class CN_alternate_model extends CN_base_model {
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
          meta: true,
          title: "Specific Role",
          type: "enum",
          enum: { path: "alternate_type" },
          help: "You can add more than one role after the alternate has been created.",
          is_hidden: (model) => "view" == model.get_type(),
        },
        global_note: { title: "Special Note", type: "text" },
      },
    });
  }

  // only allow adding when the parent module is participant or there is no parent)
  allow_add() {
    const parent_module = this.get_parent_module();
    return super.allow_add() && (null == parent_module || "participant" == this.get_name());
  }
}

export class CN_alternate_view extends CN_base_view {
  /**
   * Extends the parent method
   */
  async get_text(type) {
    if ("name" == type) {
      return [
        this.get_property("last_name").state.get(),
        this.get_property("first_name").state.get(),
      ].join(", ");
    }
    return await super.get_text(type);
  }
}
