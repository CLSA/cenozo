import { CN_action_view } from "../action/view.mjs"
import { CN_api } from "../api.mjs"
import { CN_base_element } from "../element/base_element.mjs"
import { CN_base_model } from "./base_model.mjs"
import { CN_session } from "../session.mjs"
import { CN_model_user } from "./user.mjs"

export class CN_model_export extends CN_base_model {
  /**
   * An object of table lookups used by the export_column and export_restriction models
   */
  #export_tables = {
    address: "",
    application: "application",
    auxiliary: "collection",
    consent: "consent_type",
    event: "event_type",
    hold: null,
    participant: null,
    participant_identifier: "identifier",
    phone: null,
    proxy: "proxy_type",
    site: "",
    stratum: "stratum",
    study: "study",
    trace: "trace_type",
  };

  constructor() {
    super({
      wording: {
        singular: "export",
        plural: "exports",
        posessive: "export's",
      },
      columns: {
        title: { column: "export.title", title: "Title" },
        user: { column: "user.name", title: "Owner" },
        description: { column: "export.description", title: "Description", type: "text" },
      },
      properties: {
        title: { title: "Title", format: "identifier" },
        user_id: {
          title: "Owner",
          type: "typeahead",
          typeahead: CN_model_user.get_typeahead(),
          is_hidden: () => "add" == this.get_action_name(),
        },
        participant_count: {
          meta: null, // not associated with any column, set by the button in the postfix
          title: "Participant Count",
          is_hidden: () => "add" == this.get_action_name(),
          is_constant: () => true,
          postfix: (el) => {
            if (this.allow_edit()) {
              const btn_el = CN_base_element.html(
                '<button type="button" class="btn btn-outline-primary ms-2">Calculate</button>'
              );
              btn_el.addEventListener(
                "click",
                async () => {
                  await this.get_action().set_property_value("participant_count", "(calculating...)");
                  CN_base_element.set_disabled(btn_el, true);
                  await this.get_action().set_property_value(
                    "participant_count",
                    await CN_api.count(`${this.get_view_url(null, "api")}/participant`)
                  );
                  CN_base_element.set_disabled(btn_el, false);
                },
              );
              el.append(btn_el);
            }
          },
        },
        description: { title: "Description", type: "text" },
      },
    });
  }

  get_export_tables() { return this.#export_tables; }
}

export class CN_view_export extends CN_action_view {
  /**
   * Manually determine the participant count after loading the record
   */
  async on_load() {
    await super.on_load();

    // reset the partcipant count to unknown
    await this.set_property_value("participant_count", "(not calculated)");
  }

  /**
   * Add operations to the footer element
   */
  _create_footer_element() {
    const footer_el = super._create_footer_element();
    const left_btn_group_el = footer_el.querySelector("div[name=left-btn-group]")

    // add the generate action
    const generate_btn_el = this.constructor.html(
      '<button name="generate" type="button" class="btn btn-light btn-outline-primary">Generate</button>'
    );
    generate_btn_el.addEventListener("click", async () => {
      // create a new export_file then navigate to the returned ID
      const model = this.get_model();
      const response = await CN_api.post(`${model.get_view_url(null, "api")}/export_file`);
      await CN_session.navigate_to(`${model.get_view_url()}/export_file/view/${response}`);
    });
    left_btn_group_el.append(generate_btn_el);

    // add the duplicate action
    const duplicate_btn_el = this.constructor.html(
      '<button name="duplicate" type="button" class="btn btn-light btn-outline-primary">Duplicate</button>'
    );
    duplicate_btn_el.addEventListener("click", async () => {
      // duplicate the export on the server side then navigate to the returned ID
      const model = this.get_model();
      const response = await CN_api.post(
        `${model.get_base_path("api")}?duplicate_export_id=${model.get_identifier()}`
      );
      await CN_session.navigate_to(model.get_view_url(response));
    });
    left_btn_group_el.append(duplicate_btn_el);

    return footer_el;
  }
}
