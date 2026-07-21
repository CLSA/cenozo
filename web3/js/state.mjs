import { CN_base_object } from "./base_object.mjs"
import { CN_common } from "./common.mjs"

export class CN_state extends CN_base_object {
  #calculate_record_value;
  #stack = [];
  #element;

  constructor(calculate_record_value = null) {
    super();
    this.#calculate_record_value = (
      CN_common.is_function(calculate_record_value) ?
      calculate_record_value :
      value => value
    );
  }

  /**
   * ADD DOCS
   */
  is_bound() {
    return !!this.#element;
  }

  /**
   * Binds an element to the state (two-way binding)
   * @param Element el: The element to bind, usually a form element
   */
  bind_element(el) {
    // set the element's value to the state's current value
    this.#element = el;
    this.update_element();

    // the last argument is true so that this listener is fired before any other
    this.#element.addEventListener(
      "input",
      () => this.set(
        // getting the element's value varies depending on the type
        "file" == this.#element.type ? this.#element.files :
        "audio" == this.#element.localName ? this.#element.src :
        this.#element.value
      ),
      true
    );
  }

  /**
   * Updates the element with the state's current value
   */
  update_element() {
    if (this.#element) {
      if ("file" == this.#element.type) {
        // only set the element's value when the state's value is a FileList
        const value = this.get();
        if (CN_common.is_filelist(value)) {
          this.#element.files = value;
        } else {
          this.#element.value = "";
        }
      } else if ("audio" == this.#element.localName) {
        this.#element.src = this.get();
      } else {
        this.#element.value = this.get();
      }
    }
  }

  /**
   * Gets the current value of the state
   * @return (dynamic)
   */
  get() {
    const len = this.#stack.length;
    return 0 < len ? this.#stack[len-1].input_value : null;
  }

  /**
   * Gets the current value of the state as intended for a record
   * @return (dynamic)
   */
  get_for_record() {
    const len = this.#stack.length;
    if (0 < len) {
      // Make sure the record value has been calculating before returning the value
      return this.#stack[len-1].record_value;
    } else {
      return null;
    }
  }

  /**
   * Sets the value of the state
   * @param mixed input_value: The value to set the state to
   * @param mixed record_value: The value meant for a record (optional, will be calculated if not provided)
   */
  set(input_value, record_value = undefined) {
    // do nothing if the new value is the same as the current one
    if (this.get() === input_value) return;

    const len = this.#stack.length;
    const new_state = {
      committed: false,
      input_value: input_value,
      record_value: (
        undefined === record_value ?
        this.#calculate_record_value(input_value) :
        record_value
      ),
    };

    if (0 < len && !this.#stack[len-1].committed) {
      // when the current state isn't committed then simply overwrite it
      this.#stack[len-1] = new_state;
    } else {
      // otherwise always add the new state
      this.#stack.push(new_state);
    }

    // now apply the element binding
    this.update_element();
  }

  /**
   * Marks the state's current value as committed to the server
   */
  commit() {
    const len = this.#stack.length;
    if (0 < len) this.#stack[len-1].committed = true;
  }

  /**
   * Clears the state, removing all state history
   */
  clear() {
    this.#stack = [];
  }

  /**
   * ADD DOCS
   */
  is_committed() {
    const len = this.#stack.length;
    return 0 < len ? this.#stack[len-1].committed : false;
  }

  /**
   * Whether there are any values in the state's stack
   * @return boolean
   */
  can_undo() {
    return 1 < this.#stack.length;
  }

  /**
   * Returns to the state's earlier value
   * @param boolean committed: Whether to return to the last committed state
   */
  undo(committed=false) {
    this.#stack.pop();

    if (committed) {
      // keep going to the previous state until there are none left or we find one that is committed
      let state = this.#stack[this.#stack.length-1];
      while (state && !state.committed) {
        this.#stack.pop();
        state = this.#stack[this.#stack.length-1];
      }
    }

    // now apply the element binding
    this.update_element();
  }
}
