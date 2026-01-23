import { CN_base_modal } from "../base_modal.mjs"

export class CN_modal_input extends CN_base_modal {
  /**
   * Creates a clock settings modal (for changing the user's time-based preferences)
   * @return bootstrap.Modal
   */
  create_clock_settings_modal: function () {
    const el_id = ["cn-clock-settings-modal", CN_common.get_random_hex_identifier()].join("-");

    const modal_el = this.create(`
      <div id="${el_id}" class="modal fade" tabindex="-1">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header text-bg-primary">
              <h2 class="modal-title fw-bold fs-5">Clock Settings</h2>
            </div>
            <div class="modal-body">
              <span class="text-info-emphasis">
                Select which timezone you would like times to be displayed in.<br />
                Note that most timezones have multiple names, you may choose any.
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

    // add a timezone typeahead property
    const timezone_el_id = ["cn-timezone", CN_common.get_random_hex_identifier()].join("-");
    const timezone_el = this.create('<div class="row mb-3"></div>');
    form_el.append(timezone_el);
    const timezone_label_el = this.create_form_label({ for: "csm_timezone", value: "Timezone" });
    timezone_label_el.classList.add("col-sm-3");
    timezone_el.append(timezone_label_el);
    const timezone_element_el = this.create_form_element("typeahead", {
      id: timezone_el_id,
      required: true,
      typeahead: {
        list: CN_timezones,
        on_select: (el) => {
          if (timezone_element_el.validate()) {
            ok_btn_el.removeAttribute("disabled");
          } else {
            ok_btn_el.setAttribute("disabled", true);
          }

          const timezone_control_el = document.getElementById(timezone_el_id);
          timezone_control_el.value = el.value;
          timezone_control_el.last_selected_value = el.value;
        },
        on_cancel: () => {
          const timezone_control_el = document.getElementById(timezone_el_id);
          timezone_control_el.value = timezone_control_el.last_selected_value;
        },
      },
    });
    timezone_element_el.classList.add("col-sm-9");
    timezone_el.append(timezone_element_el);
    const timezone_control_el = document.getElementById(timezone_el_id);
    timezone_control_el.value = CN_session.data.user.timezone;
    timezone_control_el.last_selected_value = CN_session.data.user.timezone;
    timezone_control_el.addEventListener("blur", () => {
      if (!CN_timezones.includes(timezone_control_el.value)) {
        timezone_control_el.value = timezone_control_el.last_selected_value;
      }
    });

    // add a use 12-hour clock boolean property
    const am_pm_el_id = ["cn-am_pm", CN_common.get_random_hex_identifier()].join("-");
    const am_pm_el = this.create('<div class="row mb-3"></div>');
    const am_pm_label_el = this.create_form_label({
      for: am_pm_el_id,
      value: "Use 12-Hour Clock"
    });
    am_pm_label_el.classList.add("col-sm-3");
    am_pm_el.append(am_pm_label_el);
    const am_pm_element_el = this.create_form_element("boolean", {
      id: am_pm_el_id,
      required: true
    });
    am_pm_element_el.classList.add("col-sm-9");
    am_pm_el.append(am_pm_element_el);
    form_el.append(am_pm_el);
    document.getElementById(am_pm_el_id).value = CN_session.data.user.am_pm ? 1 : 0;

    ok_btn_el.addEventListener("click", async () => {
      modal_bs.hide();
      await CN_session.set_timezone(
        timezone_control_el.last_selected_value,
        1 == document.getElementById(am_pm_el_id).value,
      );
    });

    return modal_bs;
  },
}
