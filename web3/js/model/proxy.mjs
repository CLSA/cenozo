import CN_element from "../element.mjs"

import { CN_base_add } from "../base_add.mjs"
import { CN_base_model } from "../base_model.mjs"
import { CN_base_view } from "../base_view.mjs"

export class CN_proxy_model extends CN_base_model {
  constructor() {
    super({
      wording: {
        singular: "proxy",
        plural: "proxies",
        posessive: "proxy's",
      },
      columns: {
        proxy_type: { column: "proxy_type.name", title: "Type" },
        datetime: { title: "Date & Time", type: "datetime" },
      },
      properties: {
        proxy_type_id: {
          title: "Trace Type",
          type: "enum",
          enum: {
            path: "proxy_type",
            select: { column: [
              "access", // needed for the current_role_has_proxy_type statement below
              "name",
              "prompt",
              {
                // here, "current_role_has_proxy_type.proxy_type_id IS NULL" determines if the role has access
                column: "current_role_has_proxy_type.proxy_type_id IS NULL",
                alias: "disabled",
                table_prefix: false,
              }
            ]},
          },
          help: "If empty then the previous proxy is cancelled.",
        },
        datetime: {
          title: "Date & Time",
          type: "datetime",
          max: "now",
          is_hidden: (model) => "add" == model.get_action_name(),
        },
        user: {
          title: "User",
          meta: {
            column: "CONCAT(user.first_name, ' ', user.last_name, ' (', user.name, ')')",
            table_prefix: false,
          },
          is_hidden: (model) => "add" == model.get_action_name(),
        },
        site: {
          title: "Site",
          meta: { table: "site", column: "name" },
          is_hidden: (model) => "add" == model.get_action_name(),
        },
        role: {
          title: "Role",
          meta: { table: "role", column: "name" },
          is_hidden: (model) => "add" == model.get_action_name(),
        },
        application: {
          title: "Application",
          meta: { table: "application", column: "title" },
          is_hidden: (model) => "add" == model.get_action_name(),
        },
        note: { title: "Note", type: "text" },
      },
    });
  }
}

export class CN_proxy_add extends CN_base_add {
  async on_submit() {
    let proceed = true;

    // show the prompt before adding, if there is one
    const prop = this.get_property("proxy_type_id");
    const proxy_type = prop.enum.values.find(e => e.key == prop.state.get());
    if (proxy_type && proxy_type.prompt) {
      proceed = await CN_element.confirm_modal({
        static: true,
        message: prompt,
      }).test();
    }

    return proceed ? await super.on_submit() : null;
  }
}

export class CN_proxy_view extends CN_base_view {
  /**
   * Extends the parent method
   */
  async get_text(type) {
    if ("name" == type) {
      const prop = this.get_property("proxy_type_id");
      const proxy_type = prop.enum.values.find(e => e.key == prop.state.get());
      return null == proxy_type ? "Removed" : proxy_type.value;
    }
    return await super.get_text(type);
  }
}
