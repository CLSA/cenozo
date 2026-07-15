import { CN_api } from "./api.mjs"
import { CN_base_object } from "./base_object.mjs"
import { CN_common } from "./common.mjs"

/**
 * The script class which handles all VoIP integration
 */
export class CN_script_launcher extends CN_base_object {
  #initialized = false;
  #token;
  #lang;
  #on_ready;
  #window_handler;

  constructor() {
    super();
  }

  /**
   * ADD DOCS
   */
  async initialize() {
    if (!this.#initialized) {
      try {
        // TODO
        //const response = await CN_api.get(`script/${}/pine_response/${}`);
      } catch (error) {
        // ignore 404s
        if (404 == error.response.status) {
          this.#token = null;
          if (CN_common.is_function(this.#on_ready)) this.#on_ready();
        } else {
          throw error;
        }
      }
      this.#initialized = true;
    }
  }

  /**
   * ADD DOCS
   */
  open() {
    this.#window_handler = window.open();
  }

  /**
   * ADD DOCS
   */
  close() {
    if (null != this.#window_handler) this.#window_handler.close();
  }
}
