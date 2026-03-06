import { CN_action_list } from "../element/action/list.mjs"
import { CN_base_model } from "./base_model.mjs"
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
        hits: { title: "Hits", type: "number", table_prefix: false },
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
    const query_el = this.constructor.html(
      '<div class="container-fluid bg-secondary p-2"><div class="row"></div></div>'
    );
    console.log(this.get_query_parameter("q"));
    CN_element_label.create_element(query_el.querySelector("div.row"), {
      for: id,
      value: "Search",
      class: "col-sm-1",
    });
    CN_input_string.create_element(query_el.querySelector("div.row"),{
      id: id,
      class: "col-sm-11",
      get_default: () => this.get_query_parameter("q"),
      on_change: async (form_input) => {
        // when changing the search value set the query parameter and re-run the action
        this.set_query_parameter("q", form_input.get_value());
        await this.run();
      },
    });

    el.querySelector(".card-header").after(query_el);

    return el;
  }
}
