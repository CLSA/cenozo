import { CN_action_view } from "../element/action/view.mjs"
import { CN_api } from "../api.mjs"
import { CN_base_model } from "./base_model.mjs"
import { CN_common } from "../common.mjs"
import { CN_element_card } from "../element/card.mjs"

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

export class CN_overview_view extends CN_action_view {
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
   * Extend parent method
   */
  async on_load() {
    // we don't need states since all data will be static
    this.#record = await CN_api.get(this.get_on_load_path());
  }

  /**
   * Override this method to create an overview-specific placeholder
   */
  create_placeholder_element() {
    const el = this.constructor.html('<div></div>');
    const card_el = CN_element_card.create_element(el, {
      header: this.constructor.html(`<span class="placeholder col-${Math.ceil(Math.random()*3)+3}"></span>`),
      body: "",
      footer: null,
    });

    const header_el = card_el.querySelector(".card-header");
    const body_el = card_el.querySelector(".card-body");

    card_el.classList.remove("mb-2");
    header_el.classList.remove("text-bg-primary");
    header_el.classList.add("text-bg-secondary");
    header_el.classList.add("rounded-0");
    header_el.classList.add("placeholder-glow");

    for (let row = 0; row < 12; row++) {
      body_el.append(this.constructor.html(`
        <div class="row p-1 ${1 == row%2 ? 'bg-dark-subtle' : ''}">
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
    return this.constructor.html("<div></div>");
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
    const add_node = (node, parent_el, first) => {
      if (CN_common.is_array(node.value)) {
        // put the node in a card
        if (null == node.label) {
          node.value.forEach((child_node, index) => add_node(child_node, parent_el, 0 == index));
        } else {
          const card_el = CN_element_card.create_element(parent_el, {
            header: this.constructor.html(
              `<div class="d-flex"><div class="flex-grow-1">${node.label}</div></div>`
            ),
            body: "",
            footer: null,
          });

          const header_el = card_el.querySelector(".card-header");
          const body_el = card_el.querySelector(".card-body");

          card_el.classList.remove("mb-2");
          header_el.classList.remove("text-bg-primary");
          header_el.classList.add("text-bg-secondary");
          header_el.classList.add("rounded-0");

          // if we're adding multiple cards to the parent then make all cards after the first collapsable
          if (0 < parent_el.querySelectorAll(":scope > div.container-fluid").length) {
            const show = first || !node.value.some(n => CN_common.is_array(n.value));
            body_el.classList.add("py-1");
            body_el.classList.add("collapse");
            if (show) body_el.classList.add("show");

            // add a chevron button
            header_el.querySelector("div.d-flex").append(this.constructor.html(`
              <button class="btn btn-primary px-2 py-0">
                <i class="bi bi-chevron-${show ? "up" : "down"}"></i>
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

          let first_child = true;
          node.value.forEach(child_node => {
            add_node(child_node, body_el, first_child);

            // only expand the first child that contains a sub-list
            if (CN_common.is_array(child_node.value)) first_child = false;
          });
        }
      } else {
        // add the label/value as a row to the parent
        const stripe = 1 == parent_el.children.length%2;

        const child_el = this.constructor.html(`
          <div class="row p-1 ${stripe ? 'bg-dark-subtle' : ''}">
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

        parent_el.classList.add("container-fluid");
        parent_el.append(child_el);
      }
    };

    if (this.#record.data) {
      this.get_body_element().innerHTML = "";
      add_node(this.#record.data, this.get_body_element(), true);
    }
  }

  /**
   * Extend parent method
   */
  _create_element() {
    const el = super._create_element();

    el.querySelector("div.card-body").classList.remove("px-0");
    el.querySelector("div.card-body").classList.add("p-0");

    return el;
  }
}
