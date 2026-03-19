import { CN_api } from "../api.mjs"
import { CN_base_element } from "../element/base_element.mjs"
import { CN_base_model } from "./base_model.mjs"
import { CN_common } from "../common.mjs"
import { CN_session } from "../session.mjs"

export class CN_home_model extends CN_base_model {
  #element;

  constructor() {
    super({
      wording: {
        singular: "home",
        plural: "home",
        posessive: "home's",
      },
    });
  }

  /**
   * ADD DOCS
   */
  update_element() {
    const sm_el = this.#element.querySelector("[name=system-messages]");
    sm_el.innerHTML = "";

    if (0 == CN_session.system_message_list.length) {
      sm_el.append(CN_base_element.html('<div class="col-form-label">There are no system messages.</div>'));
    } else {
      CN_session.system_message_list.forEach((message, message_index) => {
        const message_el = CN_base_element.html(`
          <div class="card mt-3 px-0 ${message.unread ? "" : "text-black text-opacity-50"}">
            <div class="card-header fw-bold bg-${message.unread ? "warning" : "light"}">
              <button class="btn btn-dark">
                <i class="bi bi-envelope-${message.unread ? "" : "open-"}fill"></i>
              </button>
              ${message.title}
            </div>
            <div class="card-body">
              <blockquote class="mb-0" style="white-space: pre-wrap;">${message.note}</blockquote>
            </div>
          </div>
        `);

        const btn_el = message_el.querySelector("button");
        btn_el.addEventListener("click", async () => {
          btn_el.setAttribute("disabled", true);

          const message = CN_session.system_message_list[message_index];
          if (message.unread) {
            await CN_api.post(`system_message/${message.id}/user`, CN_session.data.user.id);
            message.unread = false;
          } else {
            await CN_api.delete(`system_message/${message.id}/user/${CN_session.data.user.id}`);
            message.unread = true;
          }

          CN_session.update_breadcrumbs();
          this.update_element();

          btn_el.removeAttribute("disabled");
        });
        sm_el.append(message_el);
      });
    }
  }

  /**
   * Replace parent method
   */
  get_element() {
    if (undefined === this.#element) {
      this.#element = CN_base_element.html(`
        <div class="container-fluid rounded bg-white p-4">
          <div class="row">
            <div class="col-sm-6">
              <div class="text-primary fs-4">Welcome to ${CN_session.data.application.title}</div>
              <div class="row ms-3">
                <label class="col-sm-3 col-form-label fw-bold">Version:</label>
                <div class="col-sm-9 col-form-label">
                  ${CN_session.data.application.version} build ${CN_session.data.application.app_build}
                </div>
              </div>
              <div class="row ms-3">
                <label class="col-sm-3 col-form-label fw-bold">Framework:</label>
                <div class="col-sm-9 col-form-label">
                  ${CN_session.data.application.cenozo} build ${CN_session.data.application.cenozo_build}
                </div>
              </div>
              <div class="row ms-3">
                <label class="col-sm-3 col-form-label fw-bold">Account:</label>
                <div class="col-sm-9 col-form-label">
                  ${CN_session.data.user.first_name} ${CN_session.data.user.last_name}
                  (${CN_session.data.user.name})
                </div>
              </div>
              <div class="row ms-3">
                <label class="col-sm-3 col-form-label fw-bold">Last login:</label>
                <div class="col-sm-9 col-form-label">
                  ${CN_common.format_datetime(CN_session.data.user.last_activity.start_datetime, "datetime")}
                  until
                  ${CN_common.format_datetime(CN_session.data.user.last_activity.end_datetime, "datetime")}
                </div>
              </div>
              <div class="row ms-3">
                <label class="col-sm-3 col-form-label fw-bold">Active Users:</label>
                <div class="col-sm-9 col-form-label">${CN_session.data.application.active_users}</div>
              </div>
              <div class="row ms-3">
                <label class="col-sm-3 col-form-label fw-bold">Uptime:</label>
                <div class="col-sm-9 col-form-label">${CN_session.data.application.uptime}</div>
              </div>
            </div>
            <div class="col-sm-6">
              <img
                class="w-100"
                src="${CN_session.data.application.cenozo_url}/img/branding.png"
                alt="${APP_TITLE}"
              ></img>
            </div>
            <div class="mt-4 text-primary fs-4">System Messages</div>
            <div name="system-messages" class="row ms-3"></div>
          </div>
        </div>
      `);
    }

    return this.#element;
  }

  /**
   * Replace parent method
   */
  async run() {
    await CN_session.update_system_messages();
    this.update_element();
  }
}
