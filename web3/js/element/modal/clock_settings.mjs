import CN_common from "../../common.mjs"
import CN_session from "../../session.mjs"
import CN_timezones from "../../timezones.mjs"

import { CN_base_modal_form } from "./base_modal_form.mjs"

export class CN_modal_clock_settings extends CN_base_modal_form {
  constructor(config = { title: "Clock Settings" }) {
    if (!CN_common.is_object(config)) {
      throw new Error("Non-object config argument passed to CN_modal_clock_settings contructor");
    }

    super(config);

    this.add_input(
      "typeahead",
      "timezone",
      "Timezone",
      {
        get_default: () => CN_session.data.user.timezone,
        typeahead: { list: CN_timezones },
      }
    );
    this.add_input("boolean", "am_pm", "Use 12-Hour Clock", { get_default: () => CN_session.data.user.am_pm });

    // add the resolve buttons
    this.add_resolve_button("light", "Cancel", () => this._resolve(false));
    this.add_resolve_button("success", "OK", async () => {
      const timezone = this.get_input_value("timezone");
      const am_pm = this.get_input_value("am_pm");
      if (CN_session.data.user.timezone != timezone || CN_session.data.user.am_pm != am_pm) {
        try {
          this.set_disabled(true);
          await CN_session.set_timezone(timezone, am_pm);
        } finally {
          this.set_disabled(false);
        }
      }
      this._resolve(true);
    });
  }

  /**
   * Extend parent method
   */
  check_form() {
    const check = super.check_form();
    const ok_btn_el = this.get_resolve_button("OK").element;
    if (check) {
      ok_btn_el.removeAttribute("disabled");
    } else {
      ok_btn_el.setAttribute("disabled", true);
    }

    return check;
  }

  /**
   * Implements the parent method
   */
  _create_body_element() {
    const body_el = super._create_body_element();
    body_el.querySelector("div[name=description]").append(this.constructor.html(`
      <div class="text-info-emphasis">
        Select which timezone you would like times to be displayed in.<br />
        Note that most timezones have multiple names, you may choose any.
      </div>
    `));

    return body_el;
  }
}
