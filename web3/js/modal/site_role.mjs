import { CN_api } from "../api.mjs"
import { CN_common } from "../common.mjs"
import { CN_modal_base_form } from "./base_form.mjs"
import { CN_session } from "../session.mjs"

export class CN_modal_site_role extends CN_modal_base_form {
  constructor(config = { title: "Select Site & Role" }) {
    if (!CN_common.is_object(config)) {
      throw new Error("Non-object config argument passed to CN_modal_site_role constructor");
    }

    super(config);

    this.add_input("enum", "site_id", "Site", { get_default: () => CN_session.get("site", "id") });
    this.add_input("enum", "role_id", "Role", { get_default: () => CN_session.get("role", "id") });

    // add the resolve buttons
    this.add_resolve_button("light", "Cancel", () => this._resolve(null));
    this.add_resolve_button(
      "success",
      "OK",
      async () => this._resolve({
        site_id: await this.get_input_value_for_record("site_id"),
        role_id: await this.get_input_value_for_record("role_id"),
      }),
      true, // submit on enter key
    );
  }

  /**
   * Implements the parent method
   */
  _create_body_element() {
    const body_el = super._create_body_element();
    body_el.querySelector("div[name=description]").append(this.constructor.html(
      '<div class="text-info-emphasis">Select which site and role you would like to switch to:</div>'
    ));

    return body_el;
  }

  /**
   * Extends the parent method
   */
  async open() {
    const promise = super.open();

    const site_form_input = this.get_input("site_id").form_input;
    const role_form_input = this.get_input("role_id").form_input;

    // populate the site and role inputs before opening the modal
    const data = await CN_api.get("self/0/access");
    const site_list = data.reduce((list, item) => {
      let site = list.find(s => s.key == item.site_id);
      if (!site) {
        site = { key: item.site_id, value: item.site_name, role_list: [] };
        list.push(site);
      }
      site.role_list.push({ key: item.role_id, value: CN_common.uc_words(item.role_name) });
      return list;
    }, []);

    // updates the role list based on the currently selected site list
    const update_role_list = async () => {
      const role_list = site_list.find(site => site.key == site_form_input.get_value()).role_list;
      role_form_input.get_config("enum").values = role_list;
      await role_form_input.update();
      const role_id = role_form_input.get_value();
      if ("" == role_id) {
        // if no role is selected then use the default value
        role_form_input.set_value(role_form_input.get_config("get_default")());
      } else {
        // if the role_id is not in the new set of values then select the first one
        if (!role_list.find(r => r.key == role_id)) role_form_input.set_value(role_list[0].key);
      }
    };

    // populate the site list and set the current site
    site_form_input.get_config("enum").values = site_list;
    site_form_input.set_config("on_change", update_role_list);
    await site_form_input.update();
    site_form_input.set_value(site_form_input.get_config("get_default")())

    // populate the role list and set the current role
    update_role_list();

    // finally, open the modal
    return promise;
  }
}
