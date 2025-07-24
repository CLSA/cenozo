(function () {
  "use strict";

  window.addEventListener("load", function () {
    const logo_el = document.querySelector("#logo");
    if (logo_el) logo_el.src = CENOZO_URL + "/img/branding.png";

    let browser = null;
    let bad_version = null;
    if (-1 != navigator.userAgent.indexOf("Edge/")) {
      browser = null;
    } else if (-1 != navigator.userAgent.indexOf("Chrome/")) {
      browser = "Chrome";
      var version = navigator.userAgent.match(/Chrome\/([^.]+)/)[1];
      if (CHROME_MIN_VER > version) bad_version = version;
    } else if (-1 != navigator.userAgent.indexOf("Firefox/")) {
      browser = "Firefox";
      var version = navigator.userAgent.match(/Firefox\/([^.]+)/)[1];
      if (FIREFOX_MIN_VER > version) bad_version = version;
    }

    if (null == browser || null != bad_version) {
      const login_header_el = document.querySelector("div.card-header");
      if (login_header_el) {
        login_header_el.classList.add("text-danger");
        login_header_el.innerHTML = "Incompatible Web Browser";
      }

      const login_body_el = document.querySelector("div.card-body");
      if (login_body_el) {
        login_body_el.innerHTML = `
          <p class="text-danger">Your browser is not compatibile.</p>
          <hr />
          <p ng-if="null == browser">
            Your web browser is not compatible with this application.
            In order to log in you must use either Firefox or Chrome.
            If you are seeing this message despite using one of the supported browsers please contact support.
          </p>
          <p ng-if="bad_version">
            Your ` + browser + ` web browser is out of date (version ` + bad_version + ` detected).
            In order to log in you must upgrade your web browser.
          </p>
        `;
      }

      const login_footer_el = document.querySelector("div.card-footer");
      if (login_footer_el) login_footer_el.innerHTML = "";
    } else {
      const submit_button_el = document.querySelector("button[name=submit]");

      submit_button_el.addEventListener("click", () => {
        const username_label_el = document.querySelector("label[for=username]");
        const username_el = document.querySelector("#username");
        const password_label_el = document.querySelector("label[for=password]");
        const password_el = document.querySelector("#password");

        // check that the username and password are provided
        let proceed = true;
        if (username_el.value) {
          username_label_el.classList.remove("text-danger");
          username_label_el.innerHTML = "Email address";
        } else {
          username_label_el.classList.add("text-danger");
          username_label_el.innerHTML = "Email address (required)";
          proceed = false;
        }
        if (password_el.value) {
          password_label_el.classList.remove("text-danger");
          password_label_el.innerHTML = "Password";
        } else {
          password_label_el.classList.add("text-danger");
          password_label_el.innerHTML = "Password (required)";
          proceed = false;
        }

        if (proceed) {
          const login = async () => {
            submit_button_el.setAttribute("disabled", true);
            submit_button_el.innerHTML = "Processing...";

            let problem = null;
            try {
              const response = await fetch(ROOT_URL + "/api/self/0", {
                method: "post",
                headers: { Authorization: "Basic " + btoa([username_el.value, password_el.value].join(":")) },
              });

              if (201 == response.status) {
                document.getElementById("main-content").innerHTML = "";
                document.querySelector("button.home").innerHTML = "Loading...";
                window.location.reload();
              } else if (202 == response.status) {
                problem = "invalid";
              } else {
                problem = response.status;
              }
            } catch (error) {
              problem = "network";
            } finally {
              if (problem) {
                const login_footer_el = document.querySelector("span[name=login-message]");
                login_footer_el.innerHTML = (
                  "invalid" == problem ? "Invalid username and/or password, please try again." :
                  "There was an error communicating with the server (" + problem + ")."
                );

                submit_button_el.removeAttribute("disabled");
                submit_button_el.innerHTML = "Submit";
              }
            }
          };

          login();
        }
      });

      // when the enter key is pressed click the submit form
      document.addEventListener("keydown", (event) => {
        if ("Enter" == event.key) {
          submit_button_el.click();
          event.preventDefault();
        }
      });
    }
  });

})();
