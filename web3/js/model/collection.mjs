import { CN_base_model } from "../base_model.mjs"

export class CN_collection_model extends CN_base_model {
  constructor() {
    super({
      wording: {
        singular: "collection",
        plural: "collections",
        posessive: "collection's",
      },
      columns: {
        name: { title: "Name" },
        active: { title: "Active", type: "boolean" },
        locked: { title: "Locked", type: "boolean" },
        participant_count: { title: "Participants", type: "number", table_prefix: false },
        user_count: { title: "Users", type: "number", table_prefix: false },
      },
      properties: {
        name: {
          title: "Name",
          format: "alpha_num",
          help: "May only contain letters, numbers and underscores.",
        },
        active: {
          title: "Active",
          type: "boolean",
          help: "Inactive collections will not show as options in reports or to external applications.",
        },
        locked: {
          title: "Locked",
          type: "boolean",
          is_hidden: (model) => "add" == model.get_action_name(),
          help: "If locked then only users in the access list will be able to make changes to the collection.",
          onchange: async (control_el, success, model) => {
            if (success) {
              await model.on_set_property("locked");
              // re-run the model so the changed lock property is applied in the view and all child lists
              model.run(true);
            } else {
              model.get_property("locked").state.undo();
            }
          },
        },
        description: { title: "Description", type: "text" },
        access: { meta: true, type: "boolean", is_hidden: () => true },
      },
    });
  }

  /**
   * Do not allow editing if the collection is locked
   */
  allow_edit() {
    return super.allow_edit() && this.get_action().get_property("access").state.get();
  }

  /**
   * Do not allow deleting if the collection is locked
   */
  allow_delete() {
    return super.allow_delete() && (
      "view" != this.get_action_name() ||
      this.get_action().get_property("access").state.get()
    );
  }
}
