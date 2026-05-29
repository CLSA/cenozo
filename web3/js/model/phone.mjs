import { CN_model_traceable, CN_add_traceable, CN_list_traceable, CN_view_traceable } from "./traceable_model.mjs"

export class CN_model_phone extends CN_model_traceable {
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
            path: (form_input) => {
              // get a list of the owner's addresses
              const base_url = form_input.get_action().get_model().get_parent_model().get_view_url(null, "api");
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
          is_constant: (model) => "view" == model.get_action_name(),
        },
        rank: { title: "Rank", type: "rank" },
        type: { title: "Type", type: "enum" },
        number: { title: "Number", help: "If not international then must be in 000-000-0000 format." },
        note: { title: "Note", type: "text" },
      },
    });
  }
}

export class CN_add_phone extends CN_add_traceable {}
export class CN_list_phone extends CN_list_traceable {}
export class CN_view_phone extends CN_view_traceable {
  /**
   * Extends the parent method
   */
  async get_text(type) {
    if (["crumb", "name"].includes(type)) {
      await this.after_first_load();
      return [
        this.get_property_value("rank"),
        this.get_property_value("type"),
      ].join(") ");
    }
    return await super.get_text(type);
  }
}
