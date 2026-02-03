import CN_api from "../api.mjs"
import CN_element from "../element.mjs"
import CN_session from "../session.mjs"

import { CN_base_model } from "./base_model.mjs"
import { CN_action_view } from "../element/action/view.mjs"

export class CN_mail_model extends CN_base_model {
  constructor() {
    super({
      wording: {
        singular: "email",
        plural: "email",
        posessive: "email's",
      },
      columns: {
        uid: { column: "participant.uid", title: "Participant" },
        schedule_datetime: { title: "Scheduled Date & Time", type: "datetime" },
        sent_datetime: { title: "Sent Date & Time", type: "datetime" },
        sent: { title: "Sent", type: "boolean" },
        subject: { title: "Subject" },
      },
      properties: {
        from_name: {
          title: "From Name",
          is_constant: (model) => (
            "view" == model.get_action_name() &&
            null != model.get_action().get_property_value("sent_datetime")
          ),
        },
        from_address: {
          title: "From Address",
          type: "email",
          help: 'Must be in the format "account@domain.name".',
          is_constant: (model) => (
            "view" == model.get_action_name() &&
            null != model.get_action().get_property_value("sent_datetime")
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
            null != model.get_action().get_property_value("sent_datetime")
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
            null != model.get_action().get_property_value("sent_datetime")
          ),
        },
        cc_address: {
          title: "Carbon Copy (CC)",
          help: 'May be a comma-delimited list of email addresses in the format "account@domain.name".',
          is_constant: (model) => (
            "view" == model.get_action_name() &&
            null != model.get_action().get_property_value("sent_datetime")
          ),
        },
        bcc_address: {
          title: "Blind Carbon Copy (BCC)",
          help: 'May be a comma-delimited list of email addresses in the format "account@domain.name".',
          is_constant: (model) => (
            "view" == model.get_action_name() &&
            null != model.get_action().get_property_value("sent_datetime")
          ),
        },
        schedule_datetime: {
          title: "Scheduled Date & Time",
          type: "datetime",
          min: "now",
          is_constant: (model) => (
            "view" == model.get_action_name() &&
            null != model.get_action().get_property_value("sent_datetime")
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
            null != model.get_action().get_property_value("sent_datetime")
          ),
        },
        body: {
          title: "Body",
          type: "text",
          is_constant: (model) => (
            "view" == model.get_action_name() &&
            null != model.get_action().get_property_value("sent_datetime")
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
   * Only allow email to be deleted if it hasn't been sent
   */
  allow_delete() {
    return (
      super.allow_delete() &&
      "mail.view" == CN_session.get_leaf_action_name() &&
      null == this.get_action().get_property_value("sent_datetime")
    );
  }
}

export class CN_mail_view extends CN_action_view {
  /**
   * Add extra operations to the footer
   */
  create_footer_element() {
    const footer_el = super.create_footer_element();

    const preview_btn_el = CN_element.create(
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

      CN_element.message_modal({
        title: "Mail Preview",
        message: message,
        size: "xl",
      }).show();
    });
    footer_el.append(preview_btn_el);

    return footer_el;
  }
}
