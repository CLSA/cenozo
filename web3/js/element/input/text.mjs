import { CN_base_input } from "./base_input.mjs"
import { CN_common } from "../../common.mjs"

export class CN_input_text extends CN_base_input {
  constructor(parent_el, config = {}) {
    if (!CN_common.is_object(config)) {
      throw new Error("Non-object config argument passed to CN_input_text contructor");
    }

    super(parent_el, {
      ...{
        // default config
        rows: 3,
      },
      ...config
    });
  }

  /**
   * Extends the parent method
   */
  _create_control_element() {
    const rows = this.get_config("rows");
    return this.constructor.html(`
      <textarea
        class="form-control"
        rows="${rows}"
        oninput="
          const height = this.scrollHeight;
          const min_height = ${rows} * 28;
          this.style.height = '';
          this.style.height = (height < min_height ? min_height : height) + 'px';
        "
      ></textarea>
    `);
  }

  /**
   * Extend parent method
   */
  set_value(value) {
    super.set_value(value);
    this.update_element();
  }

  /**
   * Replace parent method
   */
  flash_border() {
    const control_el = this.get_control_element();
    if (control_el) {
      const old_style = control_el.style;
      control_el.style["border-color"] = "green";
      setTimeout(() => {
        control_el.style = old_style;
        this.update_element();
      }, 500);
    }
  }

  /**
   * Resizes the control element's textarea based on its current scroll height
   */
  update_element() {
    super.update_element();

    const control_el = this.get_control_element();
    if (control_el) {
      const min_height = this.get_config("rows") * 28;
      const height = control_el.scrollHeight;
      control_el.style.height = "";
      control_el.style.height = (height < min_height ? min_height : height) + 'px';
    }
  }

  /**
   * Convenience method to create and add to a parent element (without needing access to the created object)
   * @param object params: The parameters sent to the class constructor
   * @return Element
   */
  static create_element(parent_el = null, config = {}) {
    const el = new CN_input_text(parent_el, config).get_element();
    if (parent_el) parent_el.append(el);
    return el;
  }
}
