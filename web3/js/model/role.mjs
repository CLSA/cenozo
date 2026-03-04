import { CN_session } from "../session.mjs"

import { CN_base_model } from "./base_model.mjs"

export class CN_role_model extends CN_base_model {
  constructor() {
    super({
      wording: {
        singular: "role",
        plural: "roles",
        posessive: "role's",
      },
      columns: {
        name: { title: "Name" },
        user_count: { title: "Users", type: "number", table_prefix: false },
      },
    });
  }

  /**
   * Extends the parent method
   */
  get_base_path(type) {
    // restrict the application role list by application-type
    return (
      "application" == this.get_parent_model().get_name() ?
      `application_type/${CN_session.data.application.application_type_id}/role` :
      super.get_base_path(type)
    );
  }
}
