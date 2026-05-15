import { CN_action_view } from "../action/view.mjs"
import { CN_api } from "../api.mjs"
import { CN_base_model } from "./base_model.mjs"
import { CN_modal_message } from "../modal/message.mjs"
import { CN_model_trace_type } from "./trace_type.mjs"
import { CN_model_participant } from "./participant.mjs"

export class CN_model_trace_type_mail extends CN_base_model {
  constructor() {
    super({
      wording: {
        singular: "mail template",
        plural: "mail templates",
        posessive: "mail template's",
      },
      columns: {
        trace_type: { column: "trace_type.name", title: "Trace Type" },
        language: { column: "language.name", title: "Language" },
        delay: { title: "Delay", table_prefix: false },
        subject: { title: "Subject" },
      },
      properties: {
        trace_type_id: {
          title: "Trace Type",
          type: "enum",
          is_constant: () => true,
        },
        language_id: {
          title: "Language",
          type: "enum",
          enum: {
            path: "language",
            modifier: {
              where: { column: "active", operator: "=", value: true },
              order: "language.name",
            },
          },
          is_constant: (model) => "view" == model.get_action_name(),
        },
        from_name: { title: "From Name" },
        from_address: {
          title: "From Address",
          type: "email",
          help: 'Must be in the format "account@domain.name".',
        },
        cc_address: {
          title: "Carbon Copy (CC)",
          help: `
            May be a comma-delimited list of appointment_mail addresses in the format "account@domain.name".
            Note that if the participant has a second email address it will be added to this list.
          `,
        },
        bcc_address: {
          title: "Blind Carbon Copy (BCC)",
          help: 'May be a comma-delimited list of appointment_mail addresses in the format "account@domain.name".',
        },
        delay_offset: { title: "Delay (days)", type: "integer" },
        delay_unit: { title: "Delay Type", type: "enum" },
        subject: { title: "Subject" },
        body: { title: "Body", type: "text" },
      },
    });
  }
}

export class CN_view_trace_type_mail extends CN_action_view {
  /**
   * Add extra operations to the footer
   */
  create_footer_element() {
    const footer_el = super.create_footer_element();
    const left_btn_group_el = footer_el.querySelector("div[name=left-btn-group]")

    const preview_btn_el = this.constructor.html(
      '<button name="preview" type="button" class="btn btn-light btn-outline-primary">Preview</button>'
    );
    preview_btn_el.addEventListener("click", async () => {
      // add the application's header and footer to the body of the email
      const response = await CN_api.get("application/0", {
        select: { column: ["mail_header", "mail_footer"] },
      });

      let message = this.get_property_value("body");
      if (response.mail_header) {
        // if the header has html bu tthe body doesn't then convert line breaks to elements
        if (response.mail_header.match(/<html>/) && !message.match(/<[^>]+>/)) {
          message = message.replace(/\r?\n/g, "<br/>$&");
        }
        message = response.mail_header + "\n" + message;
      }
      if (response.mail_footer) message += "\n" + response.mail_footer;

      await CN_modal_message.create_and_open({
        title: "Mail Preview",
        message: message,
        size: "xl",
      });
    });
    left_btn_group_el.append(preview_btn_el);

    const validate_btn_el = this.constructor.html(
      '<button name="validate" type="button" class="btn btn-light btn-outline-primary">Validate</button>'
    );
    validate_btn_el.addEventListener("click", async () => {
      const response = await CN_api.get(this.get_model().get_view_url(null, "api"), {
        select: { column: "validate" }
      });

      const validate = JSON.parse(response.validate);
      await CN_modal_message.create_and_open({
        title: "Validation Results",
        message: [
          null == validate || !validate.subject ?
          "The subject contains no errors." :
          `The subject contains the invalid variable <span class="fw-bold">$${validate.subject}$</span>`,
          null == validate || !validate.body ?
          "The body contains no errors." :
          `The body contains the invalid variable <span class="fw-bold">$${validate.body}$</span>`,
        ].join("<br/>"),
      });
    });
    left_btn_group_el.append(validate_btn_el);

    return footer_el;
  }
 }
