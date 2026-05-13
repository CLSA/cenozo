import { CN_action_view } from "../action/view.mjs"
import { CN_api } from "../api.mjs"
import { CN_base_action } from "../action/base_action.mjs"
import { CN_model_base } from "./base_model.mjs"
import { CN_common } from "../common.mjs"
import { CN_element_card } from "../element/card.mjs"
import { CN_element_label } from "../element/label.mjs"
import { CN_input_enum } from "../input/enum.mjs"
import { CN_modal_message } from "../modal/message.mjs"
import { CN_element_participant_selection } from "./participant.mjs"
import { CN_session } from "../session.mjs"

export class CN_model_stratum extends CN_model_base {
  constructor() {
    super({
      wording: {
        singular: "stratum",
        plural: "strata",
        posessive: "strata's",
      },
      columns: {
        name: { title: "Name" },
        participant_count: {
          title: "Participants",
          type: "number",
          table_prefix: false,
          help: "The number of participants who belong to the stratum.",
        },
        eligible_count: {
          title: "Eligible",
          type: "number",
          table_prefix: false,
          help: "The number of stratum participants who are eligible for the study.",
        },
        refused_count: {
          title: "Refused",
          type: "number",
          table_prefix: false,
          help: "The number of stratum participants who refused the extra consent type.",
        },
        consented_count: {
          title: "Consented",
          type: "number",
          table_prefix: false,
          help: "The number of stratum participants who accepted the extra consent type.",
        },
        completed_count: {
          title: "Completed",
          type: "number",
          table_prefix: false,
          help: "The number of stratum participants who are eligible for and have completed the study.",
        },
        description: { title: "Description", type: "text" },
      },
      properties: {
        name: { title: "Name", format: "identifier" },
        participant_count: {
          meta: {}, // predefined by the service
          title: "Total Participants",
          is_hidden: (model) => "add" == model.get_action_name(),
          is_constant: () => true,
          help: "The number of participants who belong to the stratum.",
        },
        eligible_count: {
          meta: {}, // predefined by the service
          title: "Eligible Participants",
          is_hidden: (model) => "add" == model.get_action_name(),
          is_constant: () => true,
          help: "The number of stratum participants who are eligible for the study.",
        },
        refused_count: {
          meta: {}, // predefined by the service
          title: "Refused Participants",
          is_hidden: (model) => "add" == model.get_action_name(),
          is_constant: () => true,
          help: "The number of stratum participants who refused the extra consent type.",
        },
        consented_count: {
          meta: {}, // predefined by the service
          title: "Consented Participants",
          is_hidden: (model) => "add" == model.get_action_name(),
          is_constant: () => true,
          help: "The number of stratum participants who accepted the extra consent type.",
        },
        completed_count: {
          meta: {}, // predefined by the service
          title: "Completed Participants",
          is_hidden: (model) => "add" == model.get_action_name(),
          is_constant: () => true,
          help: "The number of stratum participants who are eligible for and have completed the study.",
        },
        description: { title: "Description", type: "text" },
      },
    });
  }
}

export class CN_view_stratum extends CN_action_view {
  /**
   * Add extra operations to the footer
   */
  create_footer_element() {
    const footer_el = super.create_footer_element();
    const left_btn_group_el = footer_el.querySelector("div[name=left-btn-group]");

    if (this.get_model().get_module().action_allowed("mass_participant")) {
      const mass_participant_btn_el = this.constructor.html(`
        <button name="mass_participant" type="button" class="btn btn-light btn-outline-primary">
          Manage Stratum Participants
        </button>
      `);
      mass_participant_btn_el.addEventListener("click", async () => {
        await CN_session.navigate_to(
          this.get_model().get_view_url().replace(/stratum\/view/, "stratum/mass_participant")
        );
      });
      left_btn_group_el.append(mass_participant_btn_el);
    }

    return footer_el;
  }
}

export class CN_mass_participant_stratum extends CN_base_action {
  #stratum = null;
  #operation = "add";
  #participant_selection;

  /**
   * Constructor
   * @param base_model model: The model that the action belongs to
   */
  constructor(parent_el, model) {
    super("mass_participant", parent_el, model);

    this.#participant_selection = new CN_element_participant_selection(null, {
      path: `stratum/${this.get_model().get_identifier()}/participant`,
    });
  }

  /**
   * Extend parent method
   */
  async get_text(type) {
    if ("crumb" == type) {
      return `${this.#stratum.name} Participants`;
    }

    if ("header" == type) {
      return `Manage ${this.#stratum.name} Participants`;
    }

    return super.get_text(type);
  }

  /**
   * Extend parent method
   */
  async on_navigate_to_parent() {
    await CN_session.navigate_to(this.get_model().get_view_url());
  }

  /**
   * Extend parent method
   */
  async on_load() {
    const model = this.get_model();

    // load the stratum details
    this.#stratum = await CN_api.get(this.get_model().get_view_url(null, "api"));
    this.#operation = "add";

    // reset the participant selection
    this.#participant_selection.set_config("data", { mode: "confirm", operation: this.#operation });
    this.#participant_selection.reset();
  }

  /**
   * Extend parent method
   */
  update_element() {
    const body_el = this.get_body_element();

    body_el.querySelector("span[name=name]").innerHTML = (
      CN_common.is_object(this.#stratum) ?
      this.#stratum.name :
      ""
    );


    // borrow the operation's error to display a warning about how add/remove works
    const element_el = body_el.querySelector("[name=operation] [name=error]");
    element_el.innerHTML = `
      <span class="fw-bold">NOTE:</span>
      When ${"add" == this.#operation ? "adding to" : "removing from"} the stratum only participants which
      ${"add" == this.#operation ? "do not already belong to this or another" : "belong to this"} stratum
      will be included in the final selection list after the "Confirm List" button is clicked.
    `;

    // setup the confirm selection
    const summary_el = body_el.querySelector("[name=participant-confirm] div.card-body");
    summary_el.innerHTML = `
      You have selected a total of ${this.#participant_selection.get_identifier_list().length} new
      participant(s) to ${"add" == this.#operation ? "add to" : "remove from"} the stratum.
      If you wish to proceed click the "${CN_common.uc_words(this.#operation)} Participants" button below.
    `;

    const confirm_btn_el = body_el.querySelector("[name=participant-confirm] button[name=confirm]");
    confirm_btn_el.innerHTML = `${CN_common.uc_words(this.#operation)} Participants`;
  }

  /**
   * Extend parent method
   */
  create_body_element() {
    const body_el = this.constructor.html(`
      <div class="container-fluid text-info-emphasis">
        <div class="pb-2">
          This utility allows you to add or remove lists of participants to or from the
          <span name="name" class="fw-bold"></span> stratum.
        </div>
        <div class="pb-2">
          In order to proceed you must first select which participants to add or remove.
          This can be done by typing the unique identifiers (ie: A123456) of all participants you wish to have
          included in the operation, then confirm that list to ensure each of the identifiers can be linked to
          a participant.
        </div>
        <div name="operation" class="row py-1"></div>
        <div name="participant-list" class="py-1"></div>
        <div name="participant-confirm" class="py-1 d-none"></div>
      </div>
    `);

    // add the operation type select
    const footer_el = body_el.querySelector("[name=operation]");
    CN_element_label.append(footer_el, { for: "operation", value: "Operation", class: "col-sm-3" });

    CN_input_enum.append(footer_el, {
      id: "operation",
      class: "col-sm-9",
      required: true,
      get_default: () => "add",
      enum: {
       values: [
         { key: "add", value: "Add to Stratum" },
         { key: "remove", value: "Remove from Stratum" },
       ],
      },
      on_change: (form_input) => {
        // since the form input isn't connected to an action we must define the default behaviour
        this.#operation = form_input.get_value();
        this.#participant_selection.set_config("data", { mode: "confirm", operation: this.#operation });
        this.#participant_selection.reset();
        this.update_element();
      },
    });

    // add the participant selection
    this.#participant_selection.set_parent_element(body_el);
    body_el.querySelector("[name=participant-list]").append(this.#participant_selection.get_element());
    this.#participant_selection.get_element().classList.add("py-2");
    this.#participant_selection.add_event_listener("selectionchanged", () => {
      const confirm_el = body_el.querySelector("[name=participant-confirm]");
      if (this.#participant_selection.get_identifier_list().length) {
        confirm_el.className.remove("d-none");
      } else {
        confirm_el.className.add("d-none");
      }
      this.update_element();
    });

    const summary_el = this.constructor.html('<div class="container-fluid"></div>');
    body_el.append(summary_el);

    // create the confirm button
    const confirm_btn_el = this.constructor.html(
      '<button name="confirm" type="button" class="btn btn-primary"></button>'
    );
    confirm_btn_el.addEventListener("click", async () => {
      const response = await CN_api.post(`stratum/${this.get_model().get_identifier()}/participant`, {
        mode: "update",
        operation: this.#operation,
        identifier_id: this.#participant_selection.get_idtype(),
        identifier_list: this.#participant_selection.get_identifier_list(),
      });

      await CN_modal_message.create_and_open({
        title: `Participants ${"add" == this.#operation ? "Added" : "Removed"}`,
        message: `
          You have successfully ${"add" == this.#operation ? "added" : "removed"} ${response} participant(s)
          ${"add" == this.#operation ? "to" : "from"} the ${this.#stratum.name} stratum.
        `,
      });

      await this.on_load();
    });

    // add the confirm card
    CN_element_card.append(body_el.querySelector("[name=participant-confirm]"), {
      header: "Confirm Selection",
      body: "",
      footer: confirm_btn_el,
    });

    return body_el;
  }

  /**
   * Extend parent method
   */
  create_footer_element() {
    const footer_el = this.constructor.html(`
      <div class="d-flex w-100">
        <div class="me-auto btn-group" role="group" name="right-btn-group"></div>
        <div class="btn-group" role="group" name="left-btn-group">
          <button name="back" type="button" class="btn btn-primary">View Stratum</button>
        </div>
      </div>
    `);

    footer_el.querySelector("button[name=back]").addEventListener("click", this.on_navigate_to_parent.bind(this));
    return footer_el;
  }
}
