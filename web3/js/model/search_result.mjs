import CN_element from "../element.mjs"

import { CN_action_list } from "../element/action/list.mjs"
import { CN_base_model } from "./base_model.mjs"

export class CN_search_result_model extends CN_base_model {
  constructor() {
    super({
      wording: {
        singular: "search result",
        plural: "search results",
        posessive: "search result's",
      },
      columns: {
        hits: { title: "Hits", type: "number" },
        uid: { column: "participant.uid", title: "UID" },
        full_name: { title: "Participant Name", table_prefix: false },
        result: { title: "Search Matches" },
      },
    });
  }
}

export class CN_search_result_list extends CN_action_list {
  /**
   * Extends the parent method
   */
  get_on_load_parameters() {
    const params = super.get_on_load_parameters();

    // add the search input box
    const query = this.get_query_parameter("q");
    if (query) params.q = query;

    return params;
  }

  /**
   * Extends the parent method
   */
  _create_element() {
    const el = super._create_element();

    // add a search box below the header
    const id = [this.get_model().get_unique_id(), "query"].join("-");
    const query_el = CN_element.create(
      '<div class="container-fluid bg-secondary p-2"><div class="row"></div></div>'
    );
    const label_el = CN_element.create_form_label({ for: id, value: "Search" });
    label_el.classList.add("col-sm-1");
    query_el.querySelector("div.row").append(label_el);
    const element_el = CN_element.create_form_element("string", { id: id });
    element_el.classList.add("col-sm-11");
    const input_el = element_el.querySelector("input");
    input_el.value = this.get_query_parameter("q");
    input_el.addEventListener("change", async () => {
      // when changing the search value set the query parameter and re-run the action
      this.set_query_parameter("q", input_el.value);
      await this.run();
    });
    query_el.querySelector("div.row").append(element_el);
    el.querySelector(".card-header").after(query_el);

    return el;
  }
}
