import { CN_base_element } from "../element/base_element.mjs"
import { CN_base_model } from "./base_model.mjs"
import { CN_element_card } from "../element/card.mjs"

export class CN_model_error extends CN_base_model {
  #error;
  #element;

  constructor(error) {
    super({
      wording: {
        singular: "error",
        plural: "errors",
        posessive: "error's",
      },
    });

    this.#error = error;
  }

  /**
   * Gets UI text values by type
   * @param string type
   * @return string
   */
  async get_text(type) {
    if (["crumb", "name"].includes(type)) {
      if (this.#error instanceof URIError) {
        return this.#error.title ? this.#error.title : "Page not found (404)";
      } else if (this.#error.name) {
        return this.#error.name;
      }
      return "Unknown error";
    }

    if ("message" == type) {
      if (this.#error instanceof URIError) {
        return (
          // only show the message when the title and message is set (no title means 404)
          this.#error.title && this.#error.message ?
          this.#error.message :
          "Sorry, the page you requested does not exist."
        );
      } else if (this.#error.message) {
        return this.#error.message;
      }
      return "Sorry, an unexpected error occurred."
    }

    return `ERROR_MISSING_TEXT(${type})`;
  }

  /**
   * Replace parent method
   */
  get_element() {
    if (undefined === this.#element) {
      // report the error to the console
      let message = this.#error;
      if (this.#error.fileName) {
        message += ` (at ${this.#error.fileName}:${this.#error.lineNumber}:${this.#error.columnNumber}`;
      }
      console.error(message);

      this.#element = CN_element_card.create({
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
    }

    return this.#element;
  }

  /**
   * Replace parent method
   */
  async run() {}
}
