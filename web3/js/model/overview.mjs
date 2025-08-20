import CN_api from "../api.mjs"
import CN_common from "../common.mjs"
import CN_element from "../element.mjs"

import { CN_base_model } from "../base_model.mjs"
import { CN_base_view } from "../base_view.mjs"

export class CN_overview_model extends CN_base_model {
  constructor() {
    super({
      wording: {
        singular: "overview",
        plural: "overviews",
        posessive: "overview's",
      },
      columns: {
        title: { title: "Title" },
        description: { title: "Description", align: "left" },
      },
    });
  }
}

export class CN_overview_view extends CN_base_view {
  #record = {};

  /**
   * Extend parent method
   */
  async get_text(type) {
    if ("header" == type) {
      return this.#record.description;
    } else if (["crumb", "name"].includes(type)) {
      return `Overview: ${this.#record.title}`;
    }
    return super.get_text(type);
  }

  /**
   * ADD DOCS*
   */
  async on_load() {
    // we don't need states since all data will be static
    const response = await CN_api.get(this.get_on_load_path());
    this.#record = await response.json();
  }

  /**
   * Override this method to create an overview-specific placeholder
   */
  create_placeholder_element() {
    const el = CN_element.create('<div class="px-3"></div>');
    const card_el = CN_element.create_card({
      header: CN_element.create(`<span class="placeholder col-${Math.ceil(Math.random()*3)+3}"></span>`),
      footer: null,
    });
    card_el.classList.add("mt-2");
    el.append(card_el);

    const header_el = card_el.querySelector(".card-header");
    header_el.classList.add("placeholder-glow");

    const body_el = card_el.querySelector(".card-body");
    for (let row=0; row<12; row++) {
      body_el.append(CN_element.create(`
        <div class="row ${1 == row%2 ? 'bg-dark-subtle' : ''}">
          <label class="col placeholder-glow">
            <span class="placeholder col-${Math.ceil(Math.random()*3)+6}"></span>
          </label>
          <div class="col text-end placeholder-glow">
            <span class="placeholder col-${Math.ceil(Math.random()*3)+1}"></span>
          </div>
        </div>
      `));
    }

    return el;
  }

  /**
   * Override this method to display the overview instead of viewing it as a record
   */
  create_body_element() {
    return CN_element.create("<div></div>");
  }

  /**
   * Do not display a footer
   */
  create_footer_element() {
    return null;
  }

  /**
   * Override this method to update the overview data
   */
  update_element() {
    // build the overview based on the data property
    const add_node = (node, parent) => {
      if (CN_common.is_array(node.value)) {
        // put the node in a card
        if (null == node.label) {
          const container_el = CN_element.create('<div class="px-3"></div>');
          node.value.forEach(child_node => add_node(child_node, container_el));
          parent.append(container_el);
        } else {
          const card_el = CN_element.create_card({
            header: CN_element.create(`<div class="d-flex"><div class="flex-grow-1">${node.label}</div></div>`),
            footer: null
          });
          card_el.classList.add("mt-2");

          const header_el = card_el.querySelector(".card-header");
          const body_el = card_el.querySelector(".card-body");

          // if we're adding multiple cards to the parent then make all cards after the first collapsable
          if (0 < parent.querySelectorAll(":scope > div.container-fluid").length) {
            const id = ["overview", Math.round(Math.random()*10000000000)].join("-");
            body_el.setAttribute("id", id);
            body_el.classList.add("collapse");

            // add a chevron button
            header_el.querySelector("div.d-flex").append(CN_element.create(`
              <button class="btn btn-primary px-2 py-0">
                <i class="bi-chevron-down"></i>
              </button>
            `));

            // toggle the card's body if the header is clicked
            header_el.addEventListener("click", () => {
              bootstrap.Collapse.getOrCreateInstance(body_el).toggle();
              const i_el = header_el.querySelector("i");
              if (i_el.classList.contains("bi-chevron-down")) {
                i_el.classList.replace("bi-chevron-down", "bi-chevron-up");
              } else {
                i_el.classList.replace("bi-chevron-up", "bi-chevron-down");
              }
            });
          }

          node.value.forEach(child_node => add_node(child_node, body_el));
          parent.append(card_el);
        }
      } else {
        // add the label/value as a row to the parent
        const stripe = 1 == parent.children.length%2;

        const child_el = CN_element.create(`
          <div class="row ${stripe ? 'bg-dark-subtle' : ''}">
            <label class="col fw-bold">${node.label}</label>
            <div class="col text-end">${node.value}</div>
          </div>
        `);

        child_el.addEventListener("mouseover", () => {
          if (stripe) child_el.classList.remove("bg-dark-subtle");
          child_el.classList.add("bg-secondary");
        });

        child_el.addEventListener("mouseout", () => {
          child_el.classList.remove("bg-secondary");
          if (stripe) child_el.classList.add("bg-dark-subtle");
        });

        parent.append(child_el);
      }
    };

    this.get_body_element().innerHTML = "";
    add_node(this.#record.data, this.get_body_element());
  }
}
