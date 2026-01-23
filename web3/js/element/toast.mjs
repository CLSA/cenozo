  /**
   * Shows a toast message
   * @param object config:
   *   type: Which bootstrap color type to make the header (default light)
   *   title: The toast's title
   *   message: The toast's message
   */
  toast: function (config) {
    if (!config.type) config.type = "light";
    const toast_el = this.create(`
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
      toast_el.append(this.create(`<div name="body" class="toast-body">${config.message}</div>`));
    }

    document.querySelector("#main-toast-container .toast-container").append(toast_el);
    const toast_bs = new bootstrap.Toast(toast_el);

    // automatically dispose of the toast once finished
    toast_el.addEventListener("hidden.bs.toast", () => {
      toast_bs.dispose();
      toast_el.remove();
    });

    toast_bs.show();
  },
