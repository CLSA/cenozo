import { CN_api } from "../api.mjs"
import { CN_base_modal } from "./base_modal.mjs"
import { CN_common } from "../common.mjs"
import { CN_element_label } from "../element/label.mjs"
import { CN_input_enum } from "../input/enum.mjs"
import { CN_input_range } from "../input/range.mjs"
import { CN_input_timesecond } from "../input/timesecond.mjs"
import { CN_modal_message } from "./message.mjs"
import { CN_session } from "../session.mjs"
import { CN_voip } from "../voip.mjs"

export class CN_modal_webphone extends CN_base_modal {
  #update_interval_id = null;
  #timer_interval_id = null;
  #is_updating = false;
  #is_recording = false;
  #status_inputs = {
    last_update: { title: "Last Update", element: null },
    enabled: { title: "Server VoIP Status", element: null },
    status: { title: "Webphone Status", element: null },
    agent: { title: "Webphone Agent", element: null },
    uri: { title: "Webphone URI", element: null },
    number: { title: "Active Call Number", element: null },
    time: { title: "Active Call Time", element: null },
  };
  #audio_inputs = {
    language: { title: "Language", form_input: null, last_label: null },
    volume: { title: "Playback Volume (+0)", form_input: null },
    time_limit: { title: "Time Limit", element: null },
    time_elapsed: { title: "Time Elapsed", element: null, seconds: 0 },
  };
  #recording_list = null;
  #active_recording = null;
  #audio_btn_el = null;

  constructor(config = {}) {
    if (!CN_common.is_object(config)) {
      throw new Error("Non-object config argument passed to CN_modal_webphone constructor");
    }

    super({
      ...{
        title: "Webphone Status",
      },
      ...config,
    });

    // add the resolve buttons
    this.add_resolve_button("success", "Close", () => this._resolve());
  }

  /**
   * Extends the parent method
   */
  async open() {
    // start requesting voip updates
    const update = () => this.#update();
    this.#update_interval_id = setInterval(update, 5000);
    await this.#update();

    return super.open();
  }

  /**
   * Extend parent method
   */
  close() {
    // stop all intervals
    if (this.#timer_interval_id) {
      clearInterval(this.#timer_interval_id);
      this.#timer_interval_id = null;
    }

    if (this.#update_interval_id) {
      clearInterval(this.#update_interval_id);
      this.#update_interval_id = null;
    }

    super.close();
  }

  /**
   * Extend parent method
   */
  update_element() {
    super.update_element();

    const info = CN_voip.get_info();
    const call = CN_voip.get_call();
    const el = this.get_element();

    this.#status_inputs.last_update.element.innerHTML =
      CN_common.format_datetime(CN_voip.get_last_update(), "datetimesecond");

    const enabled_el = el.querySelector("div[name=enabled]");
    if (CN_voip.get_enabled()) {
      enabled_el.innerHTML = "Online";
      enabled_el.classList.add("text-success");
      enabled_el.classList.remove("text-danger");
    } else {
      enabled_el.innerHTML = "Offline";
      enabled_el.classList.add("text-danger");
      enabled_el.classList.remove("text-success");
    }

    const status_el = el.querySelector("div[name=status]");
    el.querySelector("div[name=status]").innerHTML = info ? info.status : "Offline";
    if (info && "Reachable" == info.status) {
      status_el.classList.add("text-success");
      status_el.classList.remove("text-danger");
      this.constructor.set_disabled(this.#audio_btn_el, false);
    } else {
      status_el.classList.add("text-danger");
      status_el.classList.remove("text-success");
      this.constructor.set_disabled(this.#audio_btn_el, true);
    }

    el.querySelector("div[name=agent]").innerHTML = info ? info.agent : "N/A";
    el.querySelector("div[name=uri]").innerHTML = info ? info.uri : "N/A";

    const number_el = el.querySelector("div[name=number]");
    el.querySelector("div[name=number]").innerHTML = call ? call.number : "Not Connected";
    if (call) {
      number_el.classList.add("text-success");
      number_el.classList.remove("text-danger");
    } else {
      number_el.classList.add("text-danger");
      number_el.classList.remove("text-success");
    }

    el.querySelector("div[name=time]").innerHTML = call ? CN_common.seconds_to_string(call.time) : "N/A";
  }

  /**
   * Implements the parent method
   */
  _create_body_element() {
    const body_el = this.constructor.html(`
      <div>
        <ul class="nav nav-tabs" role="tablist">
          <li class="nav-item" role="presentation">
            <button
              class="nav-link active"
              id="status-tab"
              data-bs-toggle="tab"
              data-bs-target="#status-tab-pane"
              type="button"
              role="tab"
              aria-controls="status-tab-pane"
              aria-selected="true"
            >Status</button>
          </li>
          <li class="nav-item" role="presentation">
            <button
              class="nav-link"
              id="recording-tab"
              data-bs-toggle="tab"
              data-bs-target="#recording-tab-pane"
              type="button"
              role="tab"
              aria-controls="recording-tab-pane"
              aria-selected="false"
            >Audio</button>
          </li>
        </ul>
        <div class="tab-content mt-2">
          <div
            class="tab-pane fade show active mt-3"
            id="status-tab-pane"
            role="tabpanel"
            aria-labelledby="status-tab"
            tabindex="0"
          ></div>
          <div
            class="tab-pane fade mt-3"
            id="recording-tab-pane"
            role="tabpanel"
            aria-labelledby="recording-tab"
            tabindex="0"
          >
            <div name="audio-details"></div>
            <hr/>
            <button type="button" name="audio" class="btn btn-primary w-100" disabled>
              Play <i class="bi bi-play-circle"></i>
            </button>
          </div>
        </div>
      </div>
    `);
    this.#audio_btn_el = body_el.querySelector("button[name=audio]");

    const status_div_el = body_el.querySelector("#status-tab-pane");
    for (const key in this.#status_inputs) {
      if (this.#status_inputs.hasOwnProperty(key)) {
        const row_el = this.constructor.html('<div class="row"></div>');
        CN_element_label.append(row_el, { for: key, value: this.#status_inputs[key].title, class: "col-sm-4" });
        this.#status_inputs[key].element = this.constructor.html(`
          <div name="${key}" class="d-flex align-items-center col-8"></div>
        `);
        row_el.append(this.#status_inputs[key].element);
        status_div_el.append(row_el);
      }
    }
    status_div_el.append(this.constructor.html(`
      <div class="mt-3 text-info-emphasis">
        If the server information appears to be out of date you can refresh it by clicking the
        reload button on the right side of the Webphone Status header.
      </div>
    `));

    const audio_details_div_el = body_el.querySelector("div[name=audio-details]");

    // add the recording details
    const row_el = this.constructor.html(`<div class="row pb-1"></div>`);
    CN_element_label.append(row_el, {
      for: "recording_id",
      value: "Selection",
      class: "col-sm-4"
    });
    audio_details_div_el.append(row_el);

    for (const key in this.#audio_inputs) {
      if (this.#audio_inputs.hasOwnProperty(key)) {
        const input = this.#audio_inputs[key];
        const row_el = this.constructor.html(`<div name="${key}" class="row pb-1 d-none"></div>`);
        CN_element_label.append(row_el, { for: key, value: input.title, class: "col-sm-4" });

        if ("language" == key) {
          input.form_input = CN_input_enum.append(row_el, {
            id: "language",
            class: "col-sm-8",
            required: true,
            enum: { values: [] },
            on_change: form_input => { input.last_label = form_input.get_value_label(); },
          });
        } else if ("volume" == key) {
          input.form_input = CN_input_range.append(row_el, {
            id: "volume",
            class: "col-sm-8",
            min: -4,
            max: 4,
            get_default: () => 0,
            on_input: form_input => {
              body_el.querySelector("div[name=volume] label").innerHTML =
                `Playback Volume (${0 <= form_input.get_value() ? "+" : ""}${form_input.get_value()})`;
            },
          });
        } else {
          input.element = this.constructor.html('<div class="d-flex align-items-center col-8"></div>');
          row_el.append(input.element);
        }
        audio_details_div_el.append(row_el);
      }
    }

    body_el.querySelector("button[name=audio]").addEventListener("click", async () => {
      if (!this.#active_recording) return;

      if (!this.#active_recording.record) await this.#play_audio();
      else if (this.#is_recording) await this.#stop_recording();
      else await this.#start_recording();
    });


    return body_el;
  }

  /**
   * Extends parent method
   */
  _create_header_element() {
    const header_el = this.constructor.html('<div class="d-flex flex-fill"></div>');

    const title_el = super._create_header_element();
    title_el.classList.add("flex-grow-1");
    header_el.append(title_el);

    const refresh_btn_el = this.constructor.html(`
      <button type="button" name="refresh" class="btn btn-primary px-2 py-0">
        <i class="bi bi-arrow-clockwise fs-5"></i>
      </button>
    `);
    refresh_btn_el.addEventListener("click", this.#update.bind(this));
    header_el.append(refresh_btn_el);

    return header_el;
  }

  /**
   * Updates the voip status and recording list from the server
   */
  async #update() {
    if (this.#is_updating) return;
    this.#is_updating = true;

    const el = this.get_element();
    for (const key in this.#status_inputs) {
      if (this.#status_inputs.hasOwnProperty(key)) {
        this.#status_inputs[key].element.innerHTML = "Loading...";
      }
    }

    await CN_session.update_webphone();
    this.update_element();

    // only update the recording list once
    if (!CN_common.is_array(this.#recording_list)) {
      const [recording_response, recording_file_response] = await Promise.all([
        CN_api.get("recording"),
        CN_api.get("recording_file", {
          select: {
            column: [
              "id",
              "recording_id",
              { table: "language", column: "name", alias: "language" },
            ],
          }
        }),
      ]);

      this.#recording_list = recording_response.map(recording => ({
        ...recording,
        ...{
          key: recording.id,
          value: `${recording.rank}. ${recording.name}`,
          file_list: [],
        }
      }));

      if (0 == this.#recording_list.length) {
        // remove the audio interface
        el.querySelector("#recording-tab-pane").replaceChildren(this.constructor.html(
          '<div class="m-2">No audio has been setup for this application.</div>'
        ));
      } else {
        recording_file_response.forEach(file => {
          this.#recording_list.find(recording => recording.id == file.recording_id).file_list.push({
            ...file,
            ...{ key: file.id, value: file.language },
          });
        });

        await this.set_active_recording(this.#recording_list[0]);

        CN_input_enum.append(this.get_element().querySelector("div[name=audio-details] div.row"), {
          id: "recording_id",
          class: "col-sm-8",
          required: true,
          enum: { values: this.#recording_list },
          get_default: () => this.#active_recording.key,
          on_change: async form_input => {
            await this.set_active_recording(
              this.#recording_list.find(recording => recording.id == form_input.get_value())
            );
          },
        });
      }
    }

    this.#is_updating = false;
  }

  /**
   * ADD DOCS
   */
  async set_active_recording(recording) {
    this.#active_recording = recording;

    if (this.#active_recording) {
      const el = this.get_element();
      const language_row_el = el.querySelector("div[name=language]");
      const volume_row_el = el.querySelector("div[name=volume]");
      const time_limit_row_el = el.querySelector("div[name=time_limit]");
      const time_elapsed_row_el = el.querySelector("div[name=time_elapsed]");

      // now update the active recording's properties
      const language_form_input = this.#audio_inputs.language.form_input;
      if (this.#active_recording.record) {
        language_row_el.classList.add("d-none");

        language_form_input.set_config("enum", { values: [] });
        await language_form_input.update();
        language_form_input.set_value(null);

        volume_row_el.classList.add("d-none");

        this.#audio_inputs.time_limit.element.innerHTML = (
          this.#active_recording.timer ?
          CN_common.seconds_to_string(this.#active_recording.timer) :
          "no limit"
        );
        time_limit_row_el.classList.remove("d-none");

        this.#audio_inputs.time_elapsed.element.innerHTML = "0 seconds";
        time_elapsed_row_el.classList.remove("d-none");
      } else {
        // if we have never selected a language make note of the first one in the file list now
        if (!this.#audio_inputs.language.last_label && 0 < this.#active_recording.file_list.length)
          this.#audio_inputs.language.last_label = this.#active_recording.file_list[0];
        const selected_file = this.#active_recording.file_list.find(
          file => file.value == this.#audio_inputs.language.last_label
        );

        language_form_input.set_config("enum", {
          values: this.#active_recording.file_list,
        });
        await language_form_input.update();
        // remove the empty option
        language_form_input.get_control_element().querySelector('option[value=""]').remove();
        language_form_input.set_value(
          // preserve the active language, if there is one
          selected_file ?
          selected_file.key :
          0 < this.#active_recording.file_list.length ?
          this.#active_recording.file_list[0].key :
          null
        );

        language_row_el.classList.remove("d-none");
        volume_row_el.classList.remove("d-none");
        time_limit_row_el.classList.add("d-none");
        this.#audio_inputs.time_limit.element.innerHTML = "";
        time_elapsed_row_el.classList.add("d-none");
        this.#audio_inputs.time_elapsed.element.innerHTML = "";
      }
    }

  }

  /**
   * ADD DOCS
   */
  async #play_audio() {
    try {
      this.constructor.set_disabled(this.#audio_btn_el, true);
      await CN_api.patch("voip/0", {
        operation: "play_sound",
        recording_file_id: this.#audio_inputs.language.form_input.get_value_for_record(),
        volume: this.#audio_inputs.volume.form_input.get_value_for_record(),
      });
    } catch (error) {
      if (CN_common.is_uri_error(error, 404)) {
        // 404 means there is no active call
        await CN_modal_message.create_and_open({
          header_class: "text-bg-danger",
          title: "No Active Call",
          message: `Unable to play audio since you do not appear to be in a phone call.`,
        });
      } else {
        throw error;
      }
    } finally {
      this.constructor.set_disabled(this.#audio_btn_el, false);
    }
  }

  /**
   * ADD DOCS
   */
  async #start_recording() {
    this.#is_recording = true;

    try {
      this.#audio_btn_el.innerHTML = 'Stop <i class="bi bi-stop-circle"></i>';
      this.#audio_btn_el.classList.add("btn-danger");
      this.#audio_btn_el.classList.remove("btn-primary");

      await CN_api.patch("voip/0", {
        operation: "start_recording",
        recording_id: this.#active_recording.id,
      });

      // start the timer
      this.#audio_inputs.time_elapsed.seconds = 0;
      this.#audio_inputs.time_elapsed.element.innerHTML = CN_common.seconds_to_string(0);
      const timer = () => {
        this.#audio_inputs.time_elapsed.element.innerHTML = CN_common.seconds_to_string(
          ++this.#audio_inputs.time_elapsed.seconds
        );

        // automatically stop recordings if they have a time limit
        if (
          this.#active_recording.timer &&
          this.#active_recording.timer <= this.#audio_inputs.time_elapsed.seconds
        ) {
          this.#stop_recording();
        }
      };
      this.#timer_interval_id = setInterval(timer, 1000);
    } catch (error) {
      this.#is_recording = false;
      if (CN_common.is_uri_error(error, 404)) {
        // 404 means there is no active call
        await CN_modal_message.create_and_open({
          header_class: "text-bg-danger",
          title: "No Active Call",
          message: `Unable to play audio since you do not appear to be in a phone call.`,
        });
      } else {
        throw error;
      }
    }
  }

  /**
   * ADD DOCS
   */
  async #stop_recording() {
    if (this.#timer_interval_id) {
      clearInterval(this.#timer_interval_id);
      this.#timer_interval_id = null;
    }

    try {
      await CN_api.patch("voip/0", { operation: "stop_recording" });
    } catch (error) {
      if (CN_common.is_uri_error(error, 404)) {
        // 404 means there is no active call (do nothing since there is no audio to stop)
      } else {
        throw error;
      }
    } finally {
      this.#is_recording = false;
      this.#audio_btn_el.innerHTML = 'Record <i class="bi bi-record-circle"></i>';
      this.#audio_btn_el.classList.add("btn-primary");
      this.#audio_btn_el.classList.remove("btn-danger");
    }
  }
}
