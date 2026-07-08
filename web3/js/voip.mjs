import { CN_api } from "./api.mjs"
import { CN_base_object } from "./base_object.mjs"
import { CN_common } from "./common.mjs"
import { CN_session } from "./session.mjs"

/**
 * The voip class which handles all VoIP integration
 */
class voip extends CN_base_object {
  #enabled = CN_session.get("application", "voip_enabled");
  #info = null;
  #call = null;
  #last_update = null;

  // getters
  get_enabled() { return this.#enabled; }
  get_info() { return this.#info; }
  get_call() { return this.#call; }
  get_last_update() { return this.#last_update; }

  /**
   * ADD DOCS
   */
  async update() {
    if (!this.#enabled) return;

    try {
      const response = await CN_api.get("voip/0");
      this.#info = response.info;
      this.#call = response.call;
      this.last_update = CN_common.get_date();
    } catch (error) {
      this.#info = null;
      this.#call = null;
      this.#last_update = null;
    }
  }
}

// Now create the voip singleton and export it
const CN_voip = new voip();
export { CN_voip };
