import { CN_base_object } from "./base_object.mjs"
import { CN_common } from "./common.mjs"

export class CN_state extends CN_base_object {
  #stack = [];
  #element;

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
    return 0 < len ? this.#stack[len-1].value : null;
  }

  /**
   * Sets the value of the state
   * @param (dynamic) val: The value to set the state to
   */
  set(val) {
    // do nothing if the new value is the same as the current one
    if (this.get() === val) return;

    const len = this.#stack.length;
    const new_state = { value: val, committed: false };

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
   * Returns to the state's earlier value
   * @param boolean committed: Whether to return to the last committed state
   */
  undo(committed=false) {
    if (committed) {
      // keep going to the previous state until there are none left or we find one that is committed
      let state = this.#stack[this.#stack.length-1];
      while (state && !state.committed) {
        this.#stack.pop();
        state = this.#stack[this.#stack.length-1];
      }
    } else {
      // simply go to the previous state
      this.#stack.pop();
    }

    // now apply the element binding
    this.update_element();
  }
}
