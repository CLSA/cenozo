import { CN_base_modal } from "../base_modal.mjs"

export class CN_modal_input extends CN_base_modal {
  /**
   * Creates a password modal (for changing the user's password)
   * @return bootstrap.Modal
   */
  create_password_modal: function () {
    const el_id = ["cn-password-modal", CN_common.get_random_hex_identifier()].join("-");

    const modal_el = this.create(`
      <div id="${el_id}" class="modal fade" tabindex="-1">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header text-bg-primary">
              <h2 class="modal-title fw-bold fs-5">Account Details</h2>
            </div>
            <div class="modal-body">
              <div class="text-info-emphasis">
                Fill out this form to change your password.
              </div>
              <div class="text-warning-emphasis">
                Note that passwords must be at least 8 characters long.
              </div>
              <hr />
              <form></form>
            </div>
            <div class="modal-footer text-bg-secondary">
              <button type="button" class="btn btn-light" data-bs-dismiss="modal">Cancel</button>
              <button name="ok" type="button" class="btn btn-primary" disabled>OK</button>
            </div>
          </div>
        </div>
      </div>
    `);

    document.getElementById("main-content").append(modal_el);
    const form_el = modal_el.querySelector("form");
    const ok_btn_el = modal_el.querySelector("[name=ok]");
    const modal_bs = new bootstrap.Modal(modal_el, { keyboard: false, backdrop: "static" });

    // automatically dispose of the modal once finished
    modal_el.addEventListener("hidden.bs.modal", () => {
      modal_bs.dispose();
      modal_el.remove();
    });

    // create elements
    const elements = {
      current_password: {
        title: "Current Password",
        el_id: ["cn-current-password", CN_common.get_random_hex_identifier()].join("-"),
      },
      new_password: {
        title: "New Password",
        el_id: ["cn-new-password", CN_common.get_random_hex_identifier()].join("-"),
      },
      new_password_check: {
        title: "Repeat New Password",
        el_id: ["cn-password-check", CN_common.get_random_hex_identifier()].join("-"),
      },
    };

    for (const id in elements) {
      const element = elements[id];
      const el = this.create('<div class="row mb-3"></div>');
      const label_el = this.create_form_label({ for: element.el_id, value: element.title });
      label_el.classList.add("col-sm-4");
      el.append(label_el);
      const element_el = this.create_form_element("password", { id: element.el_id, required: true });
      element_el.classList.add("col-sm-8");
      el.append(element_el);
      form_el.append(el);
      element.control_el = document.getElementById(element.el_id);
    }

    // track when the ok button should be enabled
    const update_ok_btn = () => {
      if (
        0 < elements.current_password.control_el.value.length &&
        8 <= elements.new_password.control_el.value.length &&
        8 <= elements.new_password_check.control_el.value.length
      ) {
        ok_btn_el.removeAttribute("disabled");
      } else {
        ok_btn_el.setAttribute("disabled", true);
      }
    };

    elements.current_password.control_el.addEventListener("keyup", update_ok_btn);
    elements.new_password.control_el.addEventListener("keyup", update_ok_btn);
    elements.new_password_check.control_el.addEventListener("keyup", update_ok_btn);

    ok_btn_el.addEventListener("click", async () => {
      let current_password = elements.current_password.control_el.value;
      let new_password = elements.new_password.control_el.value;
      let new_password_check = elements.new_password_check.control_el.value;

      if (new_password !== new_password_check) {
        this.toast({
          title: "Password Mismatch",
          message: "The new passwords do not match.  Please type them again and make sure they are the same.",
          type: "danger",
        });
      } else {
        modal_bs.hide();

        // update the server
        await this.constructor.wait_for(async () => {
          try {
            await CN_api.patch("self/0", {
              user: {
                password: {
                  current: current_password,
                  requested: new_password,
                },
              },
            });
          } catch (error) {
            if (CN_common.is_object(error) && "invalid password" == error.error_code) {
              this.toast({
                title: "Password Failed",
                message: "The password you provided as your current password is incorrect.",
                type: "danger",
              });
            } else {
              throw error;
            }
          }
        });
      }
    });

    return modal_bs;
  },
}
