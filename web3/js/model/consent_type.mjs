import { CN_base_model } from "../base_model.mjs"

export class CN_consent_type_model extends CN_base_model {
  constructor() {
    super({
      wording: {
        singular: "consent type",
        plural: "consent types",
        posessive: "consent type's",
      },
      columns: {
        name: { title: "Name" },
        accept_count: { title: "Accepts", type: "number", table_prefix: false },
        deny_count: { title: "Denies", type: "number", table_prefix: false },
        role_list: { title: "Roles", table_prefix: false },
        description: { title: "Description", type: "text" },
      },
      properties: {
        name: { title: "Name", format: "identifier" },
        description: { title: "Description", type: "text" },
      },
    });
  }

  /**
   * Add accept column to participant list
   */
  configure_children() {
    super.configure_children();

    // TODO: add way in base_list to add more columns, then add a "Accept" and "Datetime" columns to the
    // participant list action (based on consent.accept and consent.datetime)
    const action = this.get_child_model_list().find(model => "participant" == model.get_name()).get_action();
  }
}
