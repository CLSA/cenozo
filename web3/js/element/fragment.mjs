  /**
   * Converts an HTML string into a DocumentFragment object
   * @param string html: HTML expressed as a string
   * @return DocumentFragment
   */
  create_fragment: function (html) {
    if (html == null) throw new Error("element.create_fragment: must provide 1 argument, 0 provided");
    if (0 == html.length) throw new Error("element.create: argument cannot be empty");

    const template = document.createElement('template');
    template.innerHTML = html.trim(); // Use trim() to handle leading/trailing whitespace
    return template.content.firstElementChild;
  },
