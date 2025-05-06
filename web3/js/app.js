// start the session once the page has finished loading
window.addEventListener("load", async () => {
  const PN_common = (await import("./common.js")).default;
  const PN_event = (await import("./event.js")).default;
  const PN_session = (await import("./session.js")).default;

  // catch all unhandled exceptions
  window.addEventListener("unhandledrejection", event => {
    const params = {
      static: true,
      title: "Unexpected Error",
      message: `
        Sorry, but an unexpected error has occurred which may cause the application to behave incorrectly.
      `,
      type: "danger",
    };
    if (PN_common.is_object(event.reason)) {
      if (event.reason.title) params.title = event.reason.title;
      if (event.reason.message) params.message = event.reason.message;

      if (event.reason.error_code) {
        params.message += `<pre class="pt-3">Error Code: ${event.reason.error_code}</pre>`;
      }
    }

    const modal = PN_event.modal_message(params);
    modal.show();
  });

  // reload modules anytime the browser navigation buttons are clicked
  window.addEventListener("popstate", async event => {
    try {
      await PN_session.load_modules();
      PN_session.render();
    } catch (error) {
      PN_session.render_error(error);
    }
  });

  PN_session.start();
}, {once: true});
