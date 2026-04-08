(function () {
  "use strict";

  /**
   * Starts the session once the page has finished loading.
   * Also handles all unhandled exceptions and handles browser navigation events.
   */
  window.addEventListener("load", async () => {
    const { CN_common } = await import("./common.mjs");
    const { CN_session } = await import("./session.mjs");
    const { CN_modal_message } = (await import("./element/modal/message.mjs"));

    // catch all unhandled exceptions
    window.addEventListener("unhandledrejection", event => {
      const params = {
        title: "Unexpected Error",
        message: "Sorry, but an unexpected error has occurred which may cause the application to behave incorrectly.",
        type: "danger",
      };
      let ignore = false;
      if (CN_common.is_object(event.reason)) {
        if (event.reason.ignore) ignore = true;
        if (event.reason.title) params.title = event.reason.title;
        if (event.reason.message) params.message = event.reason.message;
        if (event.reason.error_code) {
          params.message += `<pre class="pt-3">Error Code: ${event.reason.error_code}</pre>`;
        }
      }

      // annoyingly, Firefox tends to throw this exception a lot but we can ignore it
      if ('can\'t access property "includes", args.site.enabledFeatures is undefined' == params.message) {
        ignore = true;
      }

      if (!ignore) {
        CN_modal_message.create_and_open(params);
      }
    });

    // reload modules anytime the browser navigation buttons are clicked
    window.addEventListener("popstate", () => CN_session.render());
    CN_session.start();
  }, {once: true});

})();
