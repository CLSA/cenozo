import CN_session from "../session.mjs"

import { CN_base_model } from "../base_model.mjs"
import { CN_base_view } from "../base_view.mjs"

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
            null != model.get_action().get_property("sent_datetime").state.get()
          ),
        },
        from_address: {
          title: "From Address",
          format: "email",
          help: 'Must be in the format "account@domain.name".',
          is_constant: (model) => (
            "view" == model.get_action_name() &&
            null != model.get_action().get_property("sent_datetime").state.get()
          ),
        },
        to_name: {
          title: "To Name",
          get_default: (model) => {
            const parent_action = model.get_parent_model().get_action();
            const honorific = parent_action.get_property("honorific").state.get();
            const first_name = parent_action.get_property("first_name").state.get();
            const other_name = parent_action.get_property("other_name").state.get();
            const last_name = parent_action.get_property("last_name").state.get();
            let value = `${honorific} ${first_name}`;
            if (other_name) value += ` (${other_name})`;
            value += ` ${last_name}`;
            return value;
          },
          is_constant: (model) => (
            "view" == model.get_action_name() &&
            null != model.get_action().get_property("sent_datetime").state.get()
          ),
        },
        to_address: {
          title: "To Address",
          format: "email",
          help: 'Must be in the format "account@domain.name".',
          get_default: (model) => {
            const parent_action = model.get_parent_model().get_action();
            return parent_action.get_property("email").state.get();
          },
          is_constant: (model) => (
            "view" == model.get_action_name() &&
            null != model.get_action().get_property("sent_datetime").state.get()
          ),
        },
        cc_address: {
          title: "Carbon Copy (CC)",
          help: 'May be a comma-delimited list of email addresses in the format "account@domain.name".',
          is_constant: (model) => (
            "view" == model.get_action_name() &&
            null != model.get_action().get_property("sent_datetime").state.get()
          ),
        },
        bcc_address: {
          title: "Blind Carbon Copy (BCC)",
          help: 'May be a comma-delimited list of email addresses in the format "account@domain.name".',
          is_constant: (model) => (
            "view" == model.get_action_name() &&
            null != model.get_action().get_property("sent_datetime").state.get()
          ),
        },
        schedule_datetime: {
          title: "Scheduled Date & Time",
          type: "datetime",
          min: "now",
          is_constant: (model) => (
            "view" == model.get_action_name() &&
            null != model.get_action().get_property("sent_datetime").state.get()
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
            null != model.get_action().get_property("sent_datetime").state.get()
          ),
        },
        body: {
          title: "Body",
          type: "text",
          is_constant: (model) => (
            "view" == model.get_action_name() &&
            null != model.get_action().get_property("sent_datetime").state.get()
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
      null == this.get_action().get_property("sent_datetime").state.get()
    );
  }
}

// TODO: implement "Preview" extra view operation
