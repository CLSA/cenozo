import { CN_base_object } from "../base_object.mjs"
import { CN_base_element } from "../element/base_element.mjs";

export default class CN_time_picker extends CN_base_object {
  #parent_el;
  #options;

  #el;
  #time_el;

  #hour = 0;
  #minute = 0;
  #second = 0;

  #hour_el;
  #minute_el;
  #second_el;

  /**
   *
   * @param {*} parent_el
   * @param {*} date
   * @param {*} options
   */
  constructor(parent_el, hour, minute, second, options = { show_seconds: true }) {
    super();

    this.#parent_el = parent_el;
    this.#options = options;

    this.#hour = hour;
    this.#minute = minute;
    this.#second = second;

    this.render();
  }

  // getters/setters
  get_hour() { return this.#hour; }
  set_hour(hour) {
    this.#hour = hour;
    this.#update_display();
  }
  get_minute() { return this.#minute; }
  set_minute(minute) {
    if (minute < 0 || minute > 59) throw new Error("Invalid minute set");
    this.#minute = minute;
    this.#update_display();
  }
  get_second() { return this.#second; }
  set_second(second) {
    if (second < 0 || second > 59) throw new Error("Invalid second set");
    this.#second = second;
    this.#update_display();
  }

  #update_display() {
    this.#time_el.innerText = this.#get_display_time();
  }

  #get_display_time() {
    let am = this.#hour < 12;
    let hr12 = this.#hour > 12 ? this.#hour - 12 : this.#hour;

    const hour = hr12 < 10 ? '0' + hr12: hr12;
    const min = this.#minute < 10 ? '0' + this.#minute : this.#minute;
    const sec = this.#second < 10 ? '0' + this.#second : this.#second;

    if (this.#options.show_seconds) {
      return `${hour}:${min}:${sec} ${am ? "a.m." : "p.m."}`;
    } else {
      return `${hour}:${min} ${am ? "a.m." : "p.m."}`;
    }
  }

  render() {
    this.#parent_el.innerHTML = "";
    this.#el = CN_base_element.html(`
      <div class="container">
        <div class="row">
          <label for="time" class="form-label text-end fw-bold col-2">Time:</label>
          <div class="col-10" id="time">${this.#get_display_time()}</div>
        </div>
        <div class="row">
          <label for="hour" class="form-label text-end fw-bold col-2">Hour:</label>
          <div class="col-10">
            <input
              type="range"
              value=${this.#hour}
              class="form-range"
              id="hour"
              min="0"
              max="23"
            ></input>
          </div>
        </div>
        <div class="row">
          <label for="minute" class="form-label text-end fw-bold col-2">Minute:</label>
          <div class="col-10">
            <input
              type="range"
              value=${this.#minute}
              class="form-range"
              id="minute"
              min="0"
              max="59"
            ></input>
          </div>
        </div>
      </div>
    `);

    this.#time_el = this.#el.querySelector("#time");
    this.#hour_el = this.#el.querySelector("#hour");
    this.#minute_el = this.#el.querySelector("#minute");

    this.#hour_el.addEventListener("input", (event) => {
      this.set_hour(parseInt(event.target.value, 10));
    });

    this.#minute_el.addEventListener("input", (event) => {
      this.set_minute(parseInt(event.target.value, 10));
    });

    if (this.#options.show_seconds) {
      this.#second_el = CN_base_element.html(`
        <div class="row">
          <label for="second" class="form-label text-end fw-bold col-2">Second:</label>
          <div class="col-10">
            <input
              type="range"
              value=${this.#second}
              class="form-range"
              id="second"
              min="0"
              max="59"
            ></input>
          </div>
        </div>`
      )
      this.#second_el.addEventListener("input", (event) => {
        this.set_second(parseInt(event.target.value, 10));
      });
      this.#el.appendChild(this.#second_el);
    }

    this.#parent_el.appendChild(this.#el);
  }
}
