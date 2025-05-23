import CN_api from "../api.js"
import CN_common from "../common.js"
import CN_element from "../element.js"
import CN_session from "../session.js"

import { CN_base_object } from "../base_object.js"

export class CN_home_model extends CN_base_object {
  #element;

  constructor() {
    super();
    this.subject = "home";
  }

  get_text(type) {
    const data = CN_session.data;
    if ("title" == type) {
      return data.application.title;
    }

    if ("version" == type) {
      return `${data.application.version} build ${data.application.build}`;
    }

    if ("user_full_name" == type) {
      return `${data.user.first_name} ${data.user.last_name}`;
    }

    if ("role" == type) {
      return data.role.name;
    }

    if ("site" == type) {
      return data.site.name;
    }

    if ("last_access_start" == type) {
      return moment(data.user.last_activity.start_datetime).format(CN_common.get_datetime_format("datetime"));
    }

    if ("last_access_end" == type) {
      return moment(data.user.last_activity.end_datetime).format(CN_common.get_datetime_format("datetime"));
    }

    if ("uptime" == type) {
      return data.application.uptime;
    }

    if ("active_users" == type) {
      return data.application.active_users;
    }

    if ("logo_url" == type) {
      return `${CN_session.data.application.cenozo_url}/img/branding.png`;
    }

    if ("logo_name" == type) {
      return APP_TITLE;
    }

    return `ERROR_MISSING_TEXT(${type})`;
  }

  async mark_message(message) {
    if (message.unread) {
      await CN_api.post(`system_message/${message.id}/user`, CN_session.data.user.id);
      message.unread = false;
    } else {
      await CN_api.delete(`system_message/${message.id}/user/${CN_session.data.user.id}`);
      message.unread = true;
    }

    CN_session.update_breadcrumbs();
    this.update_element();
  }

  update_element() {
    const sm_el = this.#element.querySelector("[name=system-messages]");
    sm_el.innerHTML = "";

    if (0 == CN_session.system_message_list.length) {
      sm_el.append(CN_element.create('<div class="col-form-label">There are no system messages.</div>'));
    } else {
      CN_session.system_message_list.forEach(message => {
        const message_el = CN_element.create(`
          <div class="card mt-3 px-0 ${message.unread ? "" : "text-muted"}">
            <div class="card-header fw-bold bg-${message.unread ? "warning" : "light"}">
              <button class="btn btn-dark">
                <i class="bi-envelope-${message.unread ? "" : "open-"}fill"></i>
              </button>
              ${message.title}
            </div>
            <div class="card-body">
              <blockquote class="mb-0" style="white-space: pre-wrap;">${message.note}</blockquote>
            </div>
          </div>
        `);

        const btn_el = message_el.querySelector("button");
        btn_el.onclick = async () => {
          btn_el.disabled = true;
          await this.mark_message(message);
          btn_el.disabled = false;
        };
        sm_el.append(message_el);
      });
    }
  }

  render() {
    this.#element = CN_element.create(`
      <div class="container-fluid rounded bg-white p-4">
        <div class="row">
          <div class="col-sm-6">
            <div class="text-primary fs-4">Welcome to ${this.get_text("title")}</div>
            <div class="row ms-3">
              <label class="col-sm-3 col-form-label fw-bold">Version:</label>
              <div class="col-sm-9 col-form-label">${this.get_text("version")}</div>
            </div>
            <div class="row ms-3">
              <label class="col-sm-3 col-form-label fw-bold">Account:</label>
              <div class="col-sm-9 col-form-label">${this.get_text("user_full_name")}</div>
            </div>
            <div class="row ms-3">
              <label class="col-sm-3 col-form-label fw-bold">Role:</label>
              <div class="col-sm-9 col-form-label">${this.get_text("role")}</div>
            </div>
            <div class="row ms-3">
              <label class="col-sm-3 col-form-label fw-bold">Site:</label>
              <div class="col-sm-9 col-form-label">${this.get_text("site")}</div>
            </div>
            <div class="row ms-3">
              <label class="col-sm-3 col-form-label fw-bold">Last login:</label>
              <div class="col-sm-9 col-form-label">
                ${this.get_text("last_access_start")} until ${this.get_text("last_access_end")}
              </div>
            </div>
            <div class="row ms-3">
              <label class="col-sm-3 col-form-label fw-bold">Uptime:</label>
              <div class="col-sm-9 col-form-label">${this.get_text("uptime")}</div>
            </div>
            <div class="row ms-3">
              <label class="col-sm-3 col-form-label fw-bold">Active Users:</label>
              <div class="col-sm-9 col-form-label">${this.get_text("active_users")}</div>
            </div>
          </div>
          <div class="col-sm-6">
            <img class="w-100" src="${this.get_text("logo_url")}" alt="${this.get_text("logo_name")}"></img>
          </div>

          <div class="mt-4 text-primary fs-4">System Messages</div>
          <div name="system-messages" class="row ms-3"></div>
        </div>
      </div>
    `);

    return this.#element;
  }

  async run() {
    await CN_session.update_system_messages();
    this.update_element();
  }
}
