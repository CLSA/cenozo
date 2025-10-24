import { CN_base_list } from "../base_list.mjs"
import { CN_base_model } from "../base_model.mjs"
import { CN_base_view } from "../base_view.mjs"

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
        user_list: { title: "Users", table_prefix: false },
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
          on_change: async (control_el, valid, action) => {
            // run the default behaviour
            await action.on_change("locked", valid);

            // re-run the action so the changed property is applied in the view and all child lists
            if (valid) action.run(true);
          },
        },
        description: { title: "Description", type: "text" },
        access: { meta: {}, type: "boolean", is_hidden: () => true },
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

export class CN_collection_list extends CN_base_list {
  /**
   * Extend parent method to change the user's child title
   */
  is_choose_disabled(record) {
    // don't allow participants to be added/removed from a locked collection
    return "participant" == this.get_model().get_parent_model().get_name() && record.locked;
  }
}

export class CN_collection_view extends CN_base_view {
  /**
   * Extend parent method to change the user's child title
   */
  get_selector_child_list() {
    const child_list = super.get_selector_child_list();
    const child = child_list.find(child => "user" == child.model.get_name());
    if (child) child.title = "User Control List";
    return child_list;
  }
}
