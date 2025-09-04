import CN_common from "./common.mjs"

import { CN_base_object } from "./base_object.mjs"

export class CN_state extends CN_base_object {
  #stack = [];
  #element;
  #is_file = false;

  /**
   * Returns whether the state is bound to a file element
   */
  is_file() { return this.#is_file; }

  /**
   * Binds an element to the state (two-way binding)
   * @param Element el: The element to bind, usually a form element
   */
  bind_element(el) {
    this.#element = el;
    if ("file" == this.#element.type) this.#is_file = true;
    this.#element.addEventListener(
      "input",
      () => this.set(this.#is_file ? this.#element.files : this.#element.value),
    );
  }

  /**
   * Gets the current value of the state
   * @return (dynamic)
   */
  get() {
    const len = this.#stack.length;
    return 0 < len ? this.#stack[len-1].value : undefined;
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

    // apply element binding
    if (this.#element) {
      if (this.#is_file) {
        // only set the element's value when the state's value is a FileList
        const value = this.get();
        if (CN_common.is_filelist(value)) {
          this.#element.files = value;
        } else {
          this.#element.value = "";
        }
      } else {
        this.#element.value = this.get();
      }
    }
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

    // apply element binding
    if (this.#element) {
      if (this.#is_file) {
        // only set the element's value when the state's value is a FileList
        const value = this.get();
        if (CN_common.is_filelist(value)) {
          this.#element.files = value;
        } else {
          this.#element.value = "";
        }
      } else {
        this.#element.value = this.get();
      }
    }
  }
}
