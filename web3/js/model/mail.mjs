import { CN_action_view } from "../action/view.mjs"
import { CN_api } from "../api.mjs"
import { CN_base_model } from "./base_model.mjs"
import { CN_common } from "../common.mjs"
import { CN_modal_message } from "../modal/message.mjs"
import { CN_session } from "../session.mjs"

export class CN_model_mail extends CN_base_model {
  constructor() {
    super({
      wording: {
        singular: "email",
        plural: "emails",
        posessive: "email's",
      },
      columns: {
        uid: { column: "participant.uid", title: "Participant" },
        schedule_datetime: { title: "Scheduled Date & Time", type: "datetime" },
        sent_datetime: { title: "Sent Date & Time", type: "datetime" },
        sent: { title: "Sent", type: "boolean" },
        subject: { title: "Subject" },
      },
      get_default_order: () => ({ column: "sent_datetime", desc: true }),
      properties: {
        formatted_participant_id: {
          title: "Participant",
          meta: {},
          is_constant: () => true,
        },
        from_name: {
          title: "From Name",
          is_constant: (model) => (
            "view" == model.get_action_name() &&
            "(empty)" != model.get_action().get_property_value("sent_datetime")
          ),
        },
        from_address: {
          title: "From Address",
          type: "email",
          help: 'Must be in the format "account@domain.name".',
          is_constant: (model) => (
            "view" == model.get_action_name() &&
            "(empty)" != model.get_action().get_property_value("sent_datetime")
          ),
        },
        to_name: {
          title: "To Name",
          get_default: (model) => {
            const parent_action = model.get_parent_model().get_action();
            const honorific = parent_action.get_property_value("honorific");
            const first_name = parent_action.get_property_value("first_name");
            const other_name = parent_action.get_property_value("other_name");
            const last_name = parent_action.get_property_value("last_name");
            let value = `${honorific} ${first_name}`;
            if (other_name) value += ` (${other_name})`;
            value += ` ${last_name}`;
            return value;
          },
          is_constant: (model) => (
            "view" == model.get_action_name() &&
            "(empty)" != model.get_action().get_property_value("sent_datetime")
          ),
        },
        to_address: {
          title: "To Address",
          format: "email",
          help: 'Must be in the format "account@domain.name".',
          get_default: (model) => {
            const parent_action = model.get_parent_model().get_action();
            return parent_action.get_property_value("email");
          },
          is_constant: (model) => (
            "view" == model.get_action_name() &&
            "(empty)" != model.get_action().get_property_value("sent_datetime")
          ),
        },
        cc_address: {
          title: "Carbon Copy (CC)",
          help: 'May be a comma-delimited list of email addresses in the format "account@domain.name".',
          is_constant: (model) => (
            "view" == model.get_action_name() &&
            "(empty)" != model.get_action().get_property_value("sent_datetime")
          ),
        },
        bcc_address: {
          title: "Blind Carbon Copy (BCC)",
          help: 'May be a comma-delimited list of email addresses in the format "account@domain.name".',
          is_constant: (model) => (
            "view" == model.get_action_name() &&
            "(empty)" != model.get_action().get_property_value("sent_datetime")
          ),
        },
        schedule_datetime: {
          title: "Scheduled Date & Time",
          type: "datetime",
          get_min: () => CN_common.get_date(),
          is_constant: (model) => (
            "view" == model.get_action_name() &&
            "(empty)" != model.get_action().get_property_value("sent_datetime")
          ),
        },
        sent_datetime: {
          title: "Sent Date & Time",
          type: "datetime",
          is_hidden: (model) => "add" == model.get_action_name(),
          is_constant: () => true,
        },
        sent: {
          title: "Sent",
          type: "boolean",
          is_hidden: (model) => "add" == model.get_action_name(),
          is_constant: () => true,
        },
        subject: {
          title: "Subject",
          is_constant: (model) => (
            "view" == model.get_action_name() &&
            "(empty)" != model.get_action().get_property_value("sent_datetime")
          ),
        },
        body: {
          title: "Body",
          type: "text",
          is_constant: (model) => (
            "view" == model.get_action_name() &&
            "(empty)" != model.get_action().get_property_value("sent_datetime")
          ),
        },
        note: {
          title: "Note",
          type: "text",
          help: "Notes are for internal use only. Participants will not see this note.",
        },
      },
    });
  }

  /**
   * Extend parent method
   */
  allow_delete() {
    // Only allow email to be deleted if it hasn't been sent
    const leaf_model = CN_session.get_leaf_model();
    return (
      super.allow_delete() &&
      "mail" == leaf_model.get_name() &&
      "view" == leaf_model.get_action_name() &&
      "(empty)" == this.get_action().get_property_value("sent_datetime")
    );
  }
}

export class CN_view_mail extends CN_action_view {
  /**
   * Add extra operations to the footer
   */
  _create_footer_element() {
    const footer_el = super._create_footer_element();
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
          message = CN_common.nl_to_br(message);
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

    return footer_el;
  }
}
