import { CN_base_object } from "./base_object.mjs"

/**
 * The script class which handles all VoIP integration
 */
class script extends CN_base_object {
  #initialized = false;
  #lang;
  #window_handler;

  /**
   * ADD DOCS
   */
  close() {
    if (null != this.#window_handler) this.#window_handler.close();
  }
}

// Now create the script singleton and export it
const CN_script = new script();
export { CN_script };
