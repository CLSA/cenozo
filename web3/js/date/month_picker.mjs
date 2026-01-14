import { CN_base_object } from "../base_object.mjs";
import CN_element from "../element.mjs";

export default class CN_month_picker extends CN_base_object {
  #parent_el;
  #el;

  #year;

  #prev_btn;
  #change_view_btn;
  #next_btn;

  #listeners = [];

  /**
   *
   * @param {*} parent_el
   * @param {*} date
   */
  constructor(parent_el, year) {
    super();

    this.#parent_el = parent_el;
    this.#year = year;
  }

  /**
   *
   */
  next() {
    this.#year += 1;
    this.#year_selected();
    this.render();
  }

  /**
   *
   */
  previous() {
    this.#year -= 1;
    this.#year_selected();
    this.render();
  }

  /**
   *
   * @param {*} year
   */
  set_year(year) {
    this.#year = year;
  }

  /**
   *
   */
  #year_selected() {
    this.#listeners.forEach(listener => listener.on_year_selected(this.#year));
  }

  /**
   *
   * @param {*} event
   */
  #month_selected(event) {
    this.#listeners.forEach(listener => listener.on_month_selected(parseInt(event.target.value, 10)));
  }

  /**
   *
   */
  change_view() {
    this.#listeners.forEach(listener => listener.on_view_change())
  }

  /**
   *
   * @param {} listener
   */
  add_listener(listener) {
    this.#listeners.push(listener);
  }

  /**
   *
   */
  render() {
    this.#parent_el.innerHTML = "";
    this.#el = CN_element.create_fragment(`
      <div class="row gx-4 justify-space-between w-100">
        <button name="prev_year" class="btn btn-sm btn-primary col-1">
          <i class="bi bi-caret-left-fill"></i>
        </button>
        <button name="change_view" class="btn btn-light rounded-0 fw-bold text-center col-10 m-0">
          ${this.#year}
        </button>
        <button name="next_year" class="btn btn-sm btn-primary col-1">
          <i class="bi bi-caret-right-fill"></i>
        </button>
        <table>
          <thead>
            <tr>
              <th class="text-center" scope="col" style="width: 33%"></th>
              <th class="text-center" scope="col" style="width: 33%"></th>
              <th class="text-center" scope="col" style="width: 33%"></th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="p-0">
                <button
                  value="0"
                  class="btn btn-light col-12 rounded-0"
                >
                  January
                </button>
              </td>
              <td>
                <button
                  value="1"
                  class="btn btn-light col-12 rounded-0"
                >
                  February
                </button>
              </td>
              <td class="p-0">
                <button
                  value="2"
                  class="btn btn-light col-12 rounded-0"
                >
                  March
                </button>
              </td>
            </tr>
            <tr>
              <td>
                <button
                  value="3"
                  class="btn btn-light col-12 rounded-0"
                >
                  April
                </button>
              </td>
              <td>
                <button
                  value="4"
                  class="btn btn-light col-12 rounded-0"
                >
                  May
                </button>
              </td>
              <td>
                <button
                  value="5"
                  class="btn btn-light col-12 rounded-0"
                >
                  June
                </button>
              </td>
            </tr>
            <tr>
              <td>
                <button
                  value="6"
                  class="btn btn-light col-12 rounded-0"
                >
                  July
                </button>
              </td>
              <td>
                <button
                  value="7"
                  class="btn btn-light col-12 rounded-0"
                >
                  August
                </button>
              </td>
              <td>
                <button
                  value="8"
                  class="btn btn-light col-12 rounded-0"
                >
                  September
                </button>
              </td>
            </tr>
            <tr>
              <td>
                <button
                  value="9"
                  class="btn btn-light col-12 rounded-0"
                >
                  October
                </button>
              </td>
              <td>
                <button
                  value="10"
                  class="btn btn-light col-12 rounded-0"
                >
                  November
                </button>
              </td>
              <td>
                <button
                  value="11"
                  class="btn btn-light col-12 rounded-0"
                >
                  December
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    `);

    this.#el.querySelectorAll("td > button").forEach(button => {
      button.addEventListener("click", this.#month_selected.bind(this));
    });

    this.#next_btn = this.#el.querySelector('[name="next_year"]');
    this.#next_btn.addEventListener("click", this.next.bind(this));

    this.#prev_btn = this.#el.querySelector('[name="prev_year"]');
    this.#prev_btn.addEventListener("click", this.previous.bind(this));

    this.#change_view_btn = this.#el.querySelector('[name="change_view"]');
    this.#change_view_btn.addEventListener("click", this.change_view.bind(this));

    this.#parent_el.appendChild(this.#el);
  }
}