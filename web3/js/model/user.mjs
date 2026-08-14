import { CN_action_list } from "../action/list.mjs"
import { CN_action_view } from "../action/view.mjs"
import { CN_api } from "../api.mjs"
import { CN_base_model } from "./base_model.mjs"
import { CN_common } from "../common.mjs"
import { CN_modal_confirm } from "../modal/confirm.mjs"
import { CN_modal_input } from "../modal/input.mjs"
import { CN_modal_message } from "../modal/message.mjs"
import { CN_session } from "../session.mjs"

export class CN_model_user extends CN_base_model {
  constructor() {
    super({
      wording: {
        singular: "user",
        plural: "users",
        posessive: "user's",
      },
      columns: {
        name: { title: "Name" },
        active: { title: "Active", type: "boolean" },
        first_name: { title: "First Name" },
        last_name: { title: "Last Name" },
        role_list: { title: "Roles", table_prefix: false },
        site_list: {
          title: "Sites",
          is_hidden: () => !CN_session.get("role", "all_sites"),
          table_prefix: false,
        },
        last_access_datetime: {
          title: "Last Used",
          type: "datetime",
          help: "The last time the user accessed this application.",
          table_prefix: false,
        },
      },
      properties: {
        active: {
          title: "Active",
          type: "boolean",
          help: `
            Inactive users will not be able to log in.
            When activating a user their login failures count will automatically be reset back to 0.
          `,
        },
        login_failures: {
          title: "Login Failures",
          is_constant: () => true,
          is_hidden: () => "add" == this.get_action_name(),
          help: `
            Every time an invalid password is used to log in as this user this counter will go up.
            Once it reaches ${CN_session.get("application", "login_failure_limit")} the user will
            automatically be deactivated.
            Reactivating the user will reset the counter to 0.
          `,
        },
        name: {
          title: "Username",
          format: "alpha_num",
          is_constant: () => "view" == this.get_action_name(),
          help: "May only contain numbers, letters and underscores. Can only be defined when creating a new user.",
        },
        first_name: { title: "First Name" },
        last_name: { title: "Last Name" },
        email: {
          title: "Email",
          type: "email",
          help: `
            Must be in the format "account@domain.name"
            (if not provided then the user will be prompted for an email address the next time they login).
          `,
        },
        timezone: {
          title: "Timezone",
          type: "typeahead",
          typeahead: { list: CN_common.get_timezones() },
          help: "Which timezone the user displays times in.",
        },
        use_12hour_clock: {
          title: "Use 12-hour Clock",
          type: "boolean",
          help: "Whether to display times using the 12-hour clock (am/pm).",
        },
        site_id: {
          title: "Initial Site",
          meta: {},
          type: "enum",
          enum: {
            get_enums: async () => {
              return (await CN_api.get("site", {
                select: { column: "name" },
                modifier: { order: "name" },
                granting: true, // only return sites which we can grant access to
              })).map(record => ({
                key: record.id,
                value: record.name,
                disabled: false,
              }));
            },
          },
          help: "Which site to assign the user to.",
          is_hidden: () => "view" == this.get_action_name(),
        },
        role_id: {
          title: "Initial Role",
          meta: {},
          type: "enum",
          enum: {
            get_enums: async () => {
              return (await CN_api.get("role", {
                select: { column: "name" },
                modifier: { order: "name" },
                granting: true, // only return roles which we can grant access to
              })).map(record => ({
                key: record.id,
                value: record.name,
                disabled: false,
              }));
            },
          },
          help: "Which role to assign the user to.",
          is_hidden: () => "view" == this.get_action_name(),
        },
        language_id: {
          title: "Restrict to Language",
          meta: {},
          type: "enum",
          enum: {
            path: "language",
            modifier: {
              where: { column: "active", operator: "=", value: true },
              order: "language.name",
            },
          },
          help: `
            If the user can only speak a single language you can define it here
            (this can be changed in the user's record after they have been created).
          `,
          is_hidden: () => "view" == this.get_action_name(),
        },
      },
    });
  }

  /**
   * Extend the parent method for the special user_overview action
   */
  async clone_columns() {
    const columns = await super.clone_columns();

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
  static get_typeahead(params = {}) {
    return {
      get_list: async (value) => {
        const api_params = CN_common.merge_objects({
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
              { bracket: true, open: true },
              { column: "user.first_name", operator: "like", value: `%${value}%` },
              { column: "user.last_name", operator: "like", value: `%${value}%`, or: true },
              { column: "user.name", operator: "like", value: `%${value}%`, or: true },
              { bracket: true, open: false },
            ],
            order: 'CONCAT(user.first_name," ",user.last_name," (",user.name,")")',
            limit: 20,
          },
        }, params);
        return await CN_api.get("user", api_params);
      },
    };
  }
}

export class CN_list_user extends CN_action_list {
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
  _create_footer_element() {
    const footer_el = super._create_footer_element();

    // add the find action when viewing the base user list
    if (null == this.get_model().get_parent_model()) {
      const find_btn_el = this.constructor.html(
        '<button name="find" type="button" class="btn btn-light btn-outline-primary">Find User</button>'
      );
      find_btn_el.addEventListener("click", async () => {
        const modal = new CN_modal_input({
          title: "Find User",
          message: "Please provide the username of the user you wish to find.",
          do_not_close: true,
          input: {
            type: "string",
            required: true,
          },
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
              if (!CN_common.is_uri_error(error, 404)) throw error;
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

export class CN_overview_user extends CN_action_list {
  constructor(parent_el, model) {
    super(parent_el, model, "overview");
  }

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

export class CN_view_user extends CN_action_view {
  /**
   * Extends the parent method
   */
  _create_footer_element() {
    const footer_el = super._create_footer_element();

    const reset_password_btn_el = this.constructor.html(`
      <button
        name="reset-password"
        type="button"
        class="btn btn-light btn-outline-primary"
      >Reset Password</button>
    `);
    reset_password_btn_el.addEventListener("click", async () => {
      const username = this.get_property_value("name");
      const response = await CN_modal_confirm.create_and_open({
        title: "Reset Password",
        message: `Are you sure you wish to reset the password for user "${username}"`,
      });

      if (response) {
        try {
          await CN_api.patch(this.get_model().get_view_url(null, "api"), { password: true });
          await CN_modal_message.create_and_open({
            title: "Password Reset",
            message: `The password for user "${username}" has been successfully reset.`,
          });
        } catch (error) {
          if (CN_common.is_uri_error(error, 403)) {
            await CN_modal_message.create_and_open({
              header_class: "text-bg-danger",
              title: "Unable To Change Password",
              message: `Sorry, you do not have access to resetting the password for user "${username}".`,
            });
          } else {
            throw error;
          }
        }
      }
    });
    footer_el.querySelector("div[name=left-btn-group]").append(reset_password_btn_el);

    return footer_el;
  }
}
