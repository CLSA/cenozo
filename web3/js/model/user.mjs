import { CN_api } from "../api.mjs"
import { CN_common } from "../common.mjs"
import { CN_session } from "../session.mjs"
import { CN_action_list } from "../element/action/list.mjs"
import { CN_base_model } from "./base_model.mjs"
import { CN_modal_input } from "../element/modal/input.mjs"

export class CN_user_model extends CN_base_model {
  constructor() {
    super({
      wording: {
        singular: "user",
        plural: "users",
        posessive: "user's",
      },
      columns: {
        active: { title: "Active", type: "boolean" },
        name: { title: "Name" },
        first_name: { title: "First Name", },
        last_name: { title: "Last Name", },
        email: { title: "Email", },
      },
      properties: {
        active: { title: "Active", type: "boolean", },
        name: { title: "Name", is_constant: (model) => "view" == model.get_action_name() },
        first_name: { title: "First Name", },
        last_name: { title: "Last Name", },
        email: { title: "Email", },
        timezone: { title: "Timezone", type: "typeahead", typeahead: { list: CN_common.get_timezones() } },
        use_12hour_clock: { title: "Use 12-hour Clock", type: "boolean" },
        login_failures: { title: "Login Failures", is_hidden: (model) => "add" == model.get_action_name() },
      },
    });
  }

  /**
   * Extend the parent method for the special user_overview action
   */
  clone_columns() {
    const columns = super.clone_columns();

    if ("overview" == this.get_action_name()) {
      delete columns.active;
      delete columns.email;
      columns.site = { title: "Site", column: "site.name" };
      columns.role = { title: "Role", column: "role.name" };
      columns.last_datetime = { title: "Last Activity", column: "access.datetime", type: "datetimesecond" };
    }

    return columns;
  }

  /**
   * Extend the parent method for the special user_overview action
   */
  allow_add() {
    return super.allow_add() && "overview" != this.get_action_name();
  }

  /**
   * Returns a typeahead object for models that have a typeahead property referencing this model
   * @return object
   * @static
   */
  static get_typeahead() {
    return {
      get_list: async (value) => {
        return await CN_api.get("user", {
          select: {
            column: [{
              table: "user",
              column: "id",
              alias: "key",
            }, {
              table: "user",
              column: 'CONCAT(user.first_name," ",user.last_name," (",user.name,")")',
              alias: "value",
              table_prefix: false,
            }],
          },
          modifier: {
            where: [
              { column: "user.first_name", operator: "like", value: `%${value}%`, },
              { column: "user.last_name", operator: "like", value: `%${value}%`, or: true },
              { column: "user.name", operator: "like", value: `%${value}%`, or: true },
            ],
            order: 'CONCAT(user.first_name," ",user.last_name," (",user.name,")")',
          },
        });
      },
    };
  }
}

export class CN_user_list extends CN_action_list {
  /**
   * Extends the parent method
   */
  async get_text(type) {
    if ("header" == type) {
      const parent_model = this.get_model().get_parent_model();
      if (parent_model && "collection" == parent_model.get_name()) {
        return "User Control List";
      }
    }

    return await super.get_text(type);
  }

  /**
   * Extends the parent method
   */
  create_footer_element() {
    const footer_el = super.create_footer_element();

    // add the find action when viewing the base user list
    if (null == this.get_model().get_parent_model()) {
      const find_btn_el = this.constructor.html(
        '<button name="find" type="button" class="btn btn-light btn-outline-primary">Find User</button>'
      );
      find_btn_el.addEventListener("click", async () => {
        const modal = new CN_modal_input({
          title: "Find User",
          message: "Please provide the username of the user you wish to find.",
          input: "string",
          required: true,
          do_not_close: true,
        });

        while (true) {
          const username = await modal.open();
          modal.set_disabled(true);
          if (undefined === username) {
            modal.close();
            break;
          } else {
            let user_id = null;
            try {
              const response = await CN_api.get(
                `user/name=${encodeURIComponent(username)}`,
                { select: { column: "id" } }
              );
              user_id = response.id;
            } catch (error) {
              // ignore 404s, it just means the username doesn't exist
              if (404 != error.response.status) throw error;
            }

            if (null == user_id) {
              modal.get_input("input").form_input.show_error( "Username not found." );
            } else {
              modal.close();
              await CN_session.navigate_to(`user/view/${user_id}`);
              break;
            }
          }
          modal.set_disabled(false);
        }
      });

      footer_el.querySelector("div.btn-group").append(find_btn_el);
    }

    return footer_el;
  }
}

export class CN_user_overview extends CN_action_list {
  /**
   * Extends the parent method
   */
  async get_text(type) {
    if ("header" == type) return "Active User List";
    return await super.get_text(type);
  }

  /**
   * Extends the parent method
   */
  get_on_load_parameters() {
    const params = super.get_on_load_parameters();

    // restrict to active users only
    if (undefined == params.modifier.where) params.modifier.where = [];
    params.modifier.where.push({
      column: "access.datetime",
      operator: "!=",
      value: null,
    });
    return params;
  }
}
