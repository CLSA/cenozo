import CN_session from "../session.mjs"

import { CN_base_model } from "../base_model.mjs"
import { CN_base_view } from "../base_view.mjs"

export class CN_phone_model extends CN_base_model {
  constructor() {
    super({
      wording: {
        singular: "phone number",
        plural: "phone numbers",
        posessive: "phone number's",
      },
      columns: {
        rank: { title: "Rank", type: "rank" },
        number: { title: "Number" },
        type: { title: "Type" },
        active: { title: "Active", type: "boolean" },
      },
      properties: {
        address_id: {
          title: "Associated Address",
          type: "enum",
          enum: {
            path: (model) => {
              // get a list of the owner's addresses
              const base_url = model.get_parent_model().get_parent_module().get_model().get_view_url(null, "api");
              return `${base_url}/address`;
            },
            select: { column: [
              "id", {
                column: 'CONCAT(rank, ") ", CONCAT_WS(", ", address1, address2, city, region.name))',
                alias: "name",
                table_prefix: false
              }
            ] },
            modifier: { order: "rank" },
          },
          help: "The address that this phone number is associated with, if any.",
        },
        active: { title: "Active", type: "boolean" },
        international: {
          title: "International",
          type: "boolean",
          help: "Cannot be changed once the phone has been created.",
          is_constant: (model) => "view" == model.get_type(),
        },
        rank: { title: "Rank", type: "rank" },
        type: { title: "Type", type: "enum" },
        number: { title: "Number", help: "If not international then must be in 000-000-0000 format." },
        note: { title: "Note", type: "text" },
      },
    });
  }
}

export class CN_phone_view extends CN_base_view {
  /**
   * Extends the parent method
   */
  async get_text(type) {
    if ("name" == type) {
      return [
        this.get_property("rank").state.get(),
        this.get_property("type").state.get(),
      ].join(") ");
    }
    return await super.get_text(type);
  }
}
