import CN_common from "../../common.mjs"
import CN_session from "../../session.mjs"
import CN_timezones from "../../timezones.mjs"

import { CN_base_modal } from "./base_modal.mjs"

import { CN_input_boolean } from "../input/boolean.mjs";
import { CN_input_label } from "../input/label.mjs";
import { CN_input_typeahead } from "../input/typeahead.mjs";

export class CN_modal_clock_settings extends CN_base_modal {
  #elements;

  constructor(config = { title: "Clock Settings" }) {
    if (!CN_common.is_object(config)) {
      throw new Error("Non-object config argument passed to CN_modal_clock_settings contructor");
    }

    super(config);

    this.#elements = {
      timezone: { title: "Timezone", type: "typeahead" },
      am_pm: { title: "Use 12-Hour Clock", type: "boolean" },
    };

    // add the resolve buttons
    this.add_resolve_button("light", "Cancel", false);
    this.add_resolve_button("success", "OK", async () => {
      const timezone = this.#elements.timezone.form_input.get_value();
      const am_pm = this.#elements.am_pm.form_input.get_value();
      if (CN_session.data.user.timezone != timezone || CN_session.data.user.am_pm != am_pm) {
        await CN_session.set_timezone(timezone, am_pm);
      }
      return true;
    });
  }

  /**
   * Implements the parent method
   */
  _create_body_element() {
    const body_el = this.constructor.html(`
      <div>
        <span class="text-info-emphasis">
          Select which timezone you would like times to be displayed in.<br />
          Note that most timezones have multiple names, you may choose any.
        </span>
        <hr />
        <div name="inputs"></div>
      </div>
    `);

    // create form elements
    for (const element_name in this.#elements) {
      // create the config
      const config = {
        id: ["cn-" + element_name, CN_common.get_random_hex_identifier()].join("-"),
        name: element_name,
        required: true,
        class: "d-flex align-items-center col-sm-9",
        get_default: () => CN_session.data.user[element_name],
        on_change: (control_el, valid) => {
          const ok_btn_el = this.get_resolve_button("OK").element;
          if (valid) {
            ok_btn_el.removeAttribute("disabled");
          } else {
            ok_btn_el.setAttribute("disabled", true);
          }
        },
      };

      if ("timezone" == element_name) config.typeahead = { list: CN_timezones };

      // add the label
      const element = this.#elements[element_name];
      const el = this.constructor.html('<div class="row mb-3"></div>');
      const label_el = CN_input_label.create({ for: config.id, value: element.title });
      label_el.classList.add("col-sm-3");
      el.append(label_el);

      // add the input
      element.form_input = (
        "typeahead" == element.type ?
        new CN_input_typeahead(config) :
        new CN_input_boolean(config)
      );
      element.form_input.set_parent_element(el);
      el.append(element.form_input.render());
      body_el.querySelector("div[name=inputs]").append(el);
    }

    return body_el;
  }
}
