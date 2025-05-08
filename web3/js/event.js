// EVENT

import CN_element from "./element.js"

export default {
  /**
   * config should contain the following:
   *   type: Which bootstrap color type to make the header (default light)
   *   title: The toast's title
   *   message: The toast's message
   */
  toast: function(config) {
    if (!config.type) config.type = "light";
    const toast_el = CN_element.create(`
      <div role="alert" aria-live="assertive" aria-atomic="true" class="toast bg-light mb-2">
        <div name="header" class="toast-header text-bg-${config.type}">
          <div class="fw-bold fs-5">${config.title}</div>
          <button
            type="button"
            class="btn-close btn-close-white"
            data-bs-dismiss="toast"
            aria-label="Close"
          ></button>
        </div>
      </div>
    `);

    if (config.message) {
      toast_el.append(CN_element.create(`<div name="body" class="toast-body">${config.message}</div>`));
    }

    document.querySelector("#main-toast-container .toast-container").append(toast_el);
    const bs = new bootstrap.Toast(toast_el);
    bs.show();
  },

  modal_message: function(config) {
    if (!config.type) config.type = "light";
    const modal_el = CN_element.create(`
      <div class="modal fade" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header text-bg-${config.type}">
              <h1 class="modal-title fw-bold fs-5">${config.title}</h1>
              <button
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
    if (config.static) {
      modal_el.setAttribute("data-bs-backdrop", "static");
      modal_el.setAttribute("data-bs-keyboard", "false");
    }

    return new bootstrap.Modal(modal_el);
  },

  modal_confirm: function(config) {
    const modal_el = CN_element.create(`
      <div class="modal fade" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header text-bg-primary">
              <h1 class="modal-title fw-bold fs-5">${config.title}</h1>
            </div>
            <div class="modal-body">${config.message}</div>
            <div class="modal-footer text-bg-info py-1">
              <button
                name="no"
                type="button"
                class="btn btn-primary col-2"
                data-bs-dismiss="modal"
              >No</button>
              <button
                name="yes"
                type="button"
                class="btn btn-primary col-2"
                data-bs-dismiss="modal"
              >Yes</button>
            </div>
          </div>
        </div>
      </div>
    `);
    document.getElementById("main-content").append(modal_el);
    if (config.static) {
      modal_el.setAttribute("data-bs-backdrop", "static");
      modal_el.setAttribute("data-bs-keyboard", "false");
    }

    const bs = new bootstrap.Modal(modal_el);
    bs.test = () => {
      return new Promise((resolve, reject) => {
        bs.show();
        modal_el.querySelector("[name=no]").onclick = () => resolve(false);
        modal_el.querySelector("[name=yes]").onclick = () => resolve(true);
      });
    };

    return bs;
  },

  emit: function(name, detail) {
    const event = new CustomEvent(name, { bubbles: false, detail: detail });
    document.getElementById("main-content").dispatchEvent(event);
  },
}
