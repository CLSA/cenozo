import { CN_base_object } from "./base_object.mjs"

/**
 * A object containing a number of helpful functions
 */
export class CN_base_app_session extends CN_base_object {
  constructor() {
    super();

    if ("CN_base_app_session" == this.constructor) {
      throw new Error("Abstract class CN_base_app_session can't be instantiated.");
    }
  }

  /**
   * Run after the session is rendered
   */
  async render() {
  }

  /**
   * Run after the session has started
   */
  async start() {
  }
}
