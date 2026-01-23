  /**
   * Creates a card element containing header, body and footer sub-elements
   * @return Element
   */
  create_card: function (child_elements = {}) {
    const el = this.create(`
      <div class="container-fluid mb-2 p-0">
        <div class="card">
          <div class="card-header text-bg-primary fw-bold fs-5"></div>
          <div class="card-body"></div>
          <div class="card-footer text-bg-secondary fs-5"></div>
        </div>
      </div>
    `);

    if (undefined !== child_elements.header) {
      const header_el = el.querySelector(".card-header");
      if (CN_common.is_string(child_elements.header)) {
        header_el.innerHTML = child_elements.header;
      } else if (CN_common.is_element(child_elements.header)) {
        header_el.append(child_elements.header);
      } else if (!child_elements.header) {
        header_el.remove();
      }
    }

    if (undefined !== child_elements.body) {
      const body_el = el.querySelector(".card-body");
      if (CN_common.is_string(child_elements.body)) {
        body_el.innerHTML = child_elements.body;
      } else if (CN_common.is_element(child_elements.body)) {
        body_el.append(child_elements.body);
      } else if (!child_elements.body) {
        body_el.remove();
      }
    }

    if (undefined !== child_elements.footer) {
      const footer_el = el.querySelector(".card-footer");
      if (CN_common.is_string(child_elements.footer)) {
        footer_el.innerHTML = child_elements.footer;
      } else if (CN_common.is_element(child_elements.footer)) {
        footer_el.append(child_elements.footer);
      } else if (!child_elements.footer) {
        footer_el.remove();
      }
    }

    return el;
  },
