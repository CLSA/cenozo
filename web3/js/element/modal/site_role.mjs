import { CN_base_modal } from "../base_modal.mjs"

export class CN_modal_input extends CN_base_modal {
import { CN_base_modal } from "../base_modal.mjs"

export class CN_modal_input extends CN_base_modal {
  /**
   * Creates a clock settings modal (for changing the user's time-based preferences)
   * @return bootstrap.Modal
   */
  create_site_role_modal: function () {
    const el_id = ["cn-site-role-modal", CN_common.get_random_hex_identifier()].join("-");

    const modal_el = this.create(`
      <div id="${el_id}" class="modal fade" tabindex="-1">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header text-bg-primary">
              <h2 class="modal-title fw-bold fs-5">Select Site and Role</h2>
            </div>
            <div class="modal-body">
              <span class="text-info-emphasis">
                Select which site and role you would like to switch to:
              </span>
              <hr />
              <form></form>
            </div>
            <div class="modal-footer text-bg-secondary">
              <button type="button" class="btn btn-light" data-bs-dismiss="modal">Cancel</button>
              <button name="ok" type="button" class="btn btn-primary">OK</button>
            </div>
          </div>
        </div>
      </div>
    `);

    document.getElementById("main-content").append(modal_el);
    const form_el = modal_el.querySelector("form");
    const modal_bs = new bootstrap.Modal(modal_el, { keyboard: false, backdrop: "static" });

    // automatically dispose of the modal once finished
    modal_el.addEventListener("hidden.bs.modal", () => {
      modal_bs.dispose();
      modal_el.remove();
    });

    // used below
    const ok_btn_el = modal_el.querySelector("[name=ok]");

    // add a site enum property
    const site_el_id = ["cn-site", CN_common.get_random_hex_identifier()].join("-");
    const site_el = this.create('<div class="row mb-3"></div>');
    const site_label_el = this.create_form_label({ for: site_el_id, value: "Site" });
    site_label_el.classList.add("col-sm-3");
    site_el.append(site_label_el);
    const site_element_el = this.create_form_element("enum", { id: site_el_id, required: true });
    site_element_el.classList.add("col-sm-9");
    site_el.append(site_element_el);
    form_el.append(site_el);

    // add a role enum property
    const role_el_id = ["cn-role", CN_common.get_random_hex_identifier()].join("-");
    const role_el = this.create('<div class="row mb-3"></div>');
    const role_label_el = this.create_form_label({ for: role_el_id, value: "Role" });
    role_label_el.classList.add("col-sm-3");
    role_el.append(role_label_el);
    const role_element_el = this.create_form_element("enum", { id: role_el_id, required: true });
    role_element_el.classList.add("col-sm-9");
    role_el.append(role_element_el);
    form_el.append(role_el);

    // populate the site and role inputs when opening the modal
    modal_el.addEventListener("show.bs.modal", async () => {
      const data = await CN_api.get("self/0/access");
      const site_list = data.reduce((list, item) => {
        let site = list.find(s => s.id == item.site_id);
        if (!site) {
          site = { id: item.site_id, name: item.site_name, role_list: [] };
          list.push(site);
        }
        site.role_list.push({ id: item.role_id, name: item.role_name });
        return list;
      }, []);

      const site_control_el = document.getElementById(site_el_id);
      const role_control_el = document.getElementById(role_el_id);

      // create a function to update the role list based on the currently selected site list
      const update_role_list = () => {
        role_control_el.innerHTML = "";
        let current_site = site_list.find(site => site.id == site_control_el.value);
        if (current_site) {
          current_site.role_list.forEach(
            role => role_control_el.append(
              this.create(`<option value="${role.id}">${CN_common.uc_words(role.name)}</option>`)
            )
          );
        }
      };

      // populate the site list and set the current site
      site_list.forEach(
        site => site_control_el.append(
          this.create(`<option value="${site.id}">${site.name}</option>`)
        )
      );
      site_control_el.addEventListener("change", update_role_list);
      site_control_el.value = CN_session.data.site.id;

      // populate the role list and set the current role
      update_role_list();
      role_control_el.value = CN_session.data.role.id;
    });

    ok_btn_el.addEventListener("click", async () => {
      modal_bs.hide();
      const site_id = document.getElementById(site_el_id).value;
      const role_id = document.getElementById(role_el_id).value;
      if (CN_session.data.site.id != site_id || CN_session.data.role.id != role_id) {
        // update the user's site and role
        CN_session.set_loading_state(true);
        document.getElementById("main-content").innerHTML = "";
        await CN_api.patch("self/0", { site: { id: site_id }, role: { id: role_id } });
        CN_session.reload(true);
      }
    });

    return modal_bs;
  },
}
