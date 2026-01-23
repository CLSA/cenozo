import { CN_base_object } from "../base_object.mjs"

export class CN_element extends CN_base_object {
  // The DOMParser used by create() when creating elements from HTML strings
  static #dom_parser = new DOMParser();

  /**
   * Converts an HTML string into an Element object
   * @param string html: HTML expressed as a string
   * @return Element
   */
  static create(html) {
    if (undefined === html) throw new Error("element.create: must provide 1 argument, 0 provided");
    if (0 == html.length) throw new Error("element.create: argument cannot be empty");

    return (
      Array.isArray(html) ?
      // return an array of elements
      html.map(str => CN_element.#dom_parser.parseFromString(str, "text/html").body.firstChild) :
      // if the first character isn't opening an element then assume it is the element name only
      CN_element.#dom_parser.parseFromString(html, "text/html").body.firstChild
    );
  }

  /**
   * Converts an HTML string into a DocumentFragment object
   * @param string html: HTML expressed as a string
   * @return DocumentFragment
   */
  static create_fragment(html) {
    if (html == null) throw new Error("element.create_fragment: must provide 1 argument, 0 provided");
    if (0 == html.length) throw new Error("element.create: argument cannot be empty");

    const template = document.createElement('template');
    template.innerHTML = html.trim(); // Use trim() to handle leading/trailing whitespace
    return template.content.firstElementChild;
  }
}
