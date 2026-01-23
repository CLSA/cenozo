import { CN_base_modal } from "../base_modal.mjs"

export class CN_modal_input extends CN_base_modal {
  /**
   * Creates a modal message dialog
   * @param object config: An object that has type, title and message properties
   * @return bootstrap.Modal
   */
  message_modal: function (config) {
    if (!config.type) config.type = "primary";
    const modal_el = this.create(`
      <div class="modal fade" tabindex="-1">
        <div class="modal-dialog ${config.size ? "modal-" + config.size : ""}">
          <div class="modal-content">
            <div class="modal-header text-bg-${config.type}">
              <h1 class="modal-title fw-bold fs-5">${config.title}</h1>
              <button
                name="close"
                type="button"
                class="btn-close btn-close-white"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div class="modal-body">${config.message}</div>
          </div>
        </div>
      </div>
    `);
    document.getElementById("main-content").append(modal_el);
    const modal_bs = new bootstrap.Modal(modal_el, { keyboard: false, backdrop: "static" });
    modal_bs.block = () => {
      return new Promise((resolve, reject) => {
        modal_bs.show();
        // resolve when closing
        modal_el.addEventListener("hidden.bs.modal", () => resolve(true));
      });
    };

    // automatically dispose of the modal once finished
    modal_el.addEventListener("hidden.bs.modal", () => {
      modal_bs.dispose();
      modal_el.remove();
    });

    return modal_bs;
  },
}
