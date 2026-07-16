import { CN_api } from "./api.mjs"
import { CN_base_element } from "./element/base_element.mjs"
import { CN_base_object } from "./base_object.mjs"
import { CN_common } from "./common.mjs"
import { CN_modal_message } from "./modal/message.mjs"

/**
 * The script class which handles all VoIP integration
 */
export class CN_script_launcher extends CN_base_object {
  #initialized = false;
  #token = null;
  #window_handler = null;

  constructor(config = {}) {
    super({
      ...{
        lang: "en",
        on_ready: async (script_launcher) => {},
      },
      ...config
    });

    if (!this.has_config("script")) {
      throw new Error("Unable to create script launcher, no script parameter provided.");
    }

    const script = this.get_config("script");
    if (!CN_common.is_object(script) || !script.id || !script.url) {
      throw new Error("Unable to create script launcher, script object must have both id and url properties.");
    }

    if (!this.has_config("identifier")) {
      throw new Error("Unable to create script launcher, no identifier parameter provided.");
    }
  }

  get_token() { return this.#token; }

  /**
   * ADD DOCS
   */
  async initialize() {
    if (!this.#initialized) {
      const script_id = this.get_config("script").id;
      const identifier = this.get_config("identifier");
      const on_ready = this.get_config("on_ready");

      try {
        this.#token = await CN_api.get(`script/${script_id}/pine_response/${identifier}`);
      } catch (error) {
        // ignore 404s
        if (404 == error.response.status) {
          this.#token = null;
        } else {
          throw error;
        }
      }

      this.#initialized = true;
      await on_ready(this);
    }
  }

  /**
   * ADD DOCS
   */
  async open(url_params = {}) {
    const script = this.get_config("script");
    const identifier = this.get_config("identifier");
    const on_ready = this.get_config("on_ready");

    // create the token if it doesn't exist
    if (null == this.#token) {
      await CN_base_element.wait_for(async () => {
        this.#token = await CN_api.post(`script/${script.id}/pine_response`, { identifier: identifier });
      }, 0);
      await on_ready(this);
    }

    if (null == this.#token.token) {
      await CN_modal_message.create_and_open({
        header_class: "text-bg-danger",
        title: "Respondent Not Found",
        message: `
          There was a problem launching the script in Pine.
          Please try again or contact support if the problem persists.
        `,
      });
    } else {
      let url = script.url + this.#token.token;
      const params = (new URLSearchParams(url_params)).toString();
      if (0 < params.length) url += `?${params}`;
      this.#window_handler = window.open(url, "script_launcher");
      this.#window_handler.focus();
    }
  }

  /**
   * ADD DOCS
   */
  close() {
    if (null != this.#window_handler) {
      this.#window_handler.close();
      this.#window_handler = null;
    }
  }
}
