import { CN_action_list } from "../element/action/list.mjs"
import { CN_base_model } from "./base_model.mjs"
import { CN_base_element } from "../element/base_element.mjs"
import { CN_element_label } from "../element/label.mjs"
import { CN_input_string } from "../element/input/string.mjs"

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
    const query_el = CN_base_element.html(
      '<div class="container-fluid bg-secondary p-2"><div class="row"></div></div>'
    );
    const label_el = CN_element_label.create({ for: id, value: "Search" });
    label_el.classList.add("col-sm-1");
    query_el.querySelector("div.row").append(label_el);
    const form_input = new CN_input_string({
      id: id,
      class: "d-flex align-items-center col-sm-11",
      value: this.get_query_parameter("q"),
      on_change: async () => {
        // when changing the search value set the query parameter and re-run the action
        this.set_query_parameter("q", form_input.get_value());
        await this.run();
      },
    });

    const row_el = query_el.querySelector("div.row");
    form_input.set_parent_element(row_el);
    row_el.append(form_input.render());
    el.querySelector(".card-header").after(query_el);

    return el;
  }
}
