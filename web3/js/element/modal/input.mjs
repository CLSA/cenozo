import { CN_base_modal } from "../base_modal.mjs"

export class CN_modal_input extends CN_base_modal {
  /**
   * Creates a modal input dialog
   * @param object config: An object that has type, title, message, type and required properties
   * @return bootstrap.Modal
   */
  input_modal: function (config) {
    if (undefined === config.id) config.id = ["cn-input", CN_common.get_random_hex_identifier()].join("-");
    if (undefined === config.type) config.type = "primary";
    if (undefined === config.title) config.title = "Please Provide Input";
    if (undefined === config.input) config.input = "string";
    if (undefined === config.do_not_close) config.do_not_close = false;

    const modal_el = this.create(`
      <div class="modal fade" tabindex="-1">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header text-bg-${config.type}">
              <h1 class="modal-title fw-bold fs-5">${config.title}</h1>
            </div>
            <div class="modal-body">
              <label class="form-label text-info-emphasis" for="${config.id}">
                ${config.message}
              </label>
            </div>
            <div class="modal-footer text-bg-secondary py-1">
              <button
                name="cancel"
                type="button"
                class="btn btn-primary col-2"
                data-bs-dismiss="modal"
              >Cancel</button>
              <button
                name="confirm"
                type="button"
                class="btn btn-primary col-2"
              >Confirm</button>
            </div>
          </div>
        </div>
      </div>
    `);

    const input_el = this.create_form_element(config.input, config);
    modal_el.querySelector(".modal-body").append(input_el);

    document.getElementById("main-content").append(modal_el);
    const control_el = document.getElementById(config.id);
    if (config.value) control_el.value = config.value;

    const modal_bs = new bootstrap.Modal(modal_el, { keyboard: false, backdrop: "static" });
    modal_bs.get = () => {
      return new Promise((resolve, reject) => {
        modal_bs.show();
        modal_el.querySelector("[name=cancel]").addEventListener("click", () => resolve(undefined));
        modal_el.querySelector("[name=confirm]").addEventListener("click", () => {
          if (input_el.validate()) {
            resolve(control_el.value);
            if (!config.do_not_close) modal_bs.hide();
          }
        });
        // resolved undefined if closing any other way
        modal_el.addEventListener("hidden.bs.modal", () => resolve(undefined));
      });
    };

    modal_bs.set_error = (error) => {
      input_el.querySelector("[name=error]").innerHTML = error;
    };

    // update the size of text inputs after the modal is showing
    modal_el.addEventListener("shown.bs.modal", () => {
      if (config.value && "text" == config.input) {
        control_el.style.height = "";
        control_el.style.height = control_el.scrollHeight + "px";
      }
    });

    // automatically dispose of the modal once finished
    modal_el.addEventListener("hidden.bs.modal", () => {
      modal_bs.dispose();
      modal_el.remove();
    });

    return modal_bs;
  },
}
