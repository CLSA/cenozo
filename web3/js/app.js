(function () {
  "use strict";

  /**
   * Starts the session once the page has finished loading.
   * Also handles all unhandled exceptions and handles browser navigation events.
   */
  window.addEventListener("load", async () => {
    const CN_common = (await import("./common.mjs")).default;
    const CN_element = (await import("./element.mjs")).default;
    const CN_session = (await import("./session.mjs")).default;

    // catch all unhandled exceptions
    window.addEventListener("unhandledrejection", event => {
      const params = {
        static: true,
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
      if ('can\'t access property "includes", args.site.enabledFeatures is undefined' != params.message) {
        ignore = true;
      }

      if (!ignore) {
        const modal = CN_element.message_modal(params);
        modal.show();
      }
    });

    // reload modules anytime the browser navigation buttons are clicked
    window.addEventListener("popstate", async event => {
      try {
        await CN_session.load();
        CN_session.render();
      } catch (error) {
        CN_session.render_error(error);
      }
    });

    CN_session.start();
  }, {once: true});

})();
