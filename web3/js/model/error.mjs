import { CN_base_element } from "../element/base_element.mjs"
import { CN_base_object } from "../base_object.mjs"
import { CN_element_card } from "../element/card.mjs"

export class CN_error_model extends CN_base_object {
  #name;
  #element;

  constructor(error) {
    super();
    this.#name = "error";
    this.error = error;
    this.status = null;
  }

  // access methods
  get_element() { return this.#element; }
  get_identifier() { return null; }
  get_action_name() { return "view"; }
  get_name() { return this.#name; }

  /**
   * Gets UI text values by type
   * @param string type
   * @return string
   */
  async get_text(type) {
    if (["crumb", "name"].includes(type)) {
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
    let message = this.error;
    if (this.error.fileName) {
      message += ` (at ${this.error.fileName}:${this.error.lineNumber}:${this.error.columnNumber}`;
    }
    console.error(message);

    this.#element = CN_element_card.create_element(null, {
      header: "Loading...",
      body: "",
      footer: "",
    });
    const header_el = this.#element.querySelector(".card-header");
    header_el.classList.add("bg-danger");
    (async () => {
      header_el.innerHTML = await this.get_text("name");
      this.#element.querySelector(".card-body").innerHTML = await this.get_text("message");
    })();
    this.#element.querySelector(".card-footer").classList.add("bg-danger");

    // add the breadcrumbs
    const breadcrumbs_el = document.querySelector("#main-menu-header div[name=breadcrumbs]");
    breadcrumbs_el.innerHTML = "";
    (async () => { breadcrumbs_el.append(await CN_base_element.create_breadcrumb_trail("Error")); })();

    return this.#element;
  }

  /**
   * Runs the dynamic parts of the object
   */
  async run() {}
}
