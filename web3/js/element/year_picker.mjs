import { CN_base_element } from "../element/base_element.mjs";

export class CN_year_picker extends CN_base_element {
  #parent_el;
  #el;

  #year;

  #start_year;
  #year_range = 20;

  #previous_btn;
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

    this.#get_start_year();
  }

  set_year(year) {
    this.#year = year;
    this.render();
  }

  // Given the initial date, find the start of the decade range
  #get_start_year() {
    this.#start_year = Math.floor(this.#year / this.#year_range) * this.#year_range;
  }

  /**
   *
   */
  next() {
    this.#start_year += this.#year_range;
    this.render();
  }

  /**
   *
   */
  prev() {
    this.#start_year -= this.#year_range;
    this.render();
  }

  /**
   *
   * @param {*} listener
   */
  add_listener(listener) {
    this.#listeners.push(listener);
  }

  /**
   *
   * @param {*} event
   */
  year_selected(event) {
    this.#listeners.forEach(listener => listener.on_year_selected(parseInt(event.target.value, 10)));
  }

  /**
   *
   */
  render() {
    this.#parent_el.innerHTML = "";
    this.#el = this.constructor.html(`
      <div class="row w-100 p-2">
        <button name="prev_years" class="btn btn-sm btn-primary col-1">
          <i class="bi bi-caret-left-fill"></i>
        </button>
        <button class="btn btn-light text-center fw-bold col-10 rounded-0 m-0">
          ${this.#start_year} - ${this.#start_year + this.#year_range - 1}
        </button>
        <button name="next_years" class="btn btn-sm btn-primary col-1">
          <i class="bi bi-caret-right-fill"></i>
        </button>
        <table class="table table-responsive">
          <thead>
            <tr>
              <th class="text-center p-0" scope="col"></th>
              <th class="text-center p-0" scope="col"></th>
              <th class="text-center p-0" scope="col"></th>
              <th class="text-center p-0" scope="col"></th>
              <th class="text-center p-0" scope="col"></th>
            </tr>
          </thead>
          <tbody>
          </tbody>
        </table>
      </div>
    `);

    this.#previous_btn = this.#el.querySelector('[name="prev_years"]');
    this.#previous_btn.addEventListener("click", this.prev.bind(this));

    this.#next_btn = this.#el.querySelector('[name="next_years"]');
    this.#next_btn.addEventListener("click", this.next.bind(this));

    const body = this.#el.querySelector('tbody');
    for (let row = this.#start_year; row < this.#start_year + this.#year_range; row += 5) {
      const tr = this.constructor.html("<tr></tr>");
      for (let col = 0; col < 5; col++) {
        const td = this.constructor.html(`<td class="text-center p-0"></td>`);
        const btn = this.constructor.html(`
          <button
            class="btn btn-light col-12 rounded-0"
            value="${row + col}"
          >
            ${row + col}
          </button>
        `);
        btn.addEventListener("click", this.year_selected.bind(this));
        td.appendChild(btn);
        tr.appendChild(td);
      }
      body.appendChild(tr);
    }
    this.#parent_el.appendChild(this.#el);
  }
}

