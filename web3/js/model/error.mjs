import CN_element from "../element.mjs"

import { CN_base_object } from "../base_object.mjs"

export class CN_error_model extends CN_base_object {

  constructor(error) {
    super();
    this.subject = "error";
    this.error = error;
    this.status = null;
  }

  /**
   * Gets UI text values by type
   * @param string type
   * @return string
   */
  async get_text(type) {
    if ("name" == type) {
      if (404 == this.status) return "Page not found (404)";
      else if (this.error.name) return this.error.name;
      return "Unknown error";
    }

    if ("message" == type) {
      if (404 == this.status) return "Sorry, the page you requested does not exist.";
      else if (this.error.message) return this.error.message;
      return "Sorry, an unexpected error occurred."
    }

    return `ERROR_MISSING_TEXT(${type})`;
  }

  /**
   * Creates the element including the header, body and footer sub-elements
   * @return Element
   */
  render() {
    // report the error to the console
    console.error(this.error);

    const card_el = CN_element.create_card();
    const header_el = card_el.querySelector(".card-header");
    header_el.classList.add("bg-danger");
    (async () => {
      header_el.innerHTML = await this.get_text("name");
      card_el.querySelector(".card-body").innerHTML = await this.get_text("message");
    })();
    card_el.querySelector(".card-footer").classList.add("bg-danger");

    // add the breadcrumbs
    const breadcrumbs_el = document.querySelector("#main-menu-header div[name=breadcrumbs]");
    breadcrumbs_el.innerHTML = "";
    (async () => { breadcrumbs_el.append(await CN_element.create_breadcrumb_trail(["error"])); })();

    return card_el;
  }

  /**
   * Runs the dynamic parts of the object
   */
  async run() {}
}
