import { CN_common } from "../common.mjs"
import { CN_modal_base_form } from "./base_form.mjs"
import { CN_session } from "../session.mjs"

export class CN_modal_clock_settings extends CN_modal_base_form {
  constructor(config = {}) {
    if (!CN_common.is_object(config)) {
      throw new Error("Non-object config argument passed to CN_modal_clock_settings constructor");
    }

    super({
      ...{
        title: "Clock Settings",
      },
      ...config,
    });

    this.add_input(
      "typeahead",
      "timezone",
      "Timezone",
      {
        get_default: () => CN_session.get("user", "timezone"),
        typeahead: { list: CN_common.get_timezones() },
        required: true,
      }
    );
    this.add_input(
      "boolean",
      "am_pm",
      "Use 12-Hour Clock",
      { get_default: () => CN_session.get("user", "am_pm") },
    );

    // add the resolve buttons
    this.add_resolve_button("light", "Cancel", () => this._resolve(null));
    this.add_resolve_button(
      "success",
      "OK",
      () => this._resolve({
        timezone: this.get_input_value_for_record("timezone"),
        am_pm: this.get_input_value_for_record("am_pm"),
      }),
      true, // submit on enter key
    );
  }

  /**
   * Extend parent method
   */
  async _check_form() {
    const check = await super._check_form();
    this.constructor.set_disabled(this.get_resolve_button("OK").element, !check);
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
