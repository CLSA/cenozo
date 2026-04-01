import { CN_base_model } from "./base_model.mjs"
import { CN_trace_type_model } from "./trace_type.mjs"
import { CN_participant_model } from "./participant.mjs"

export class CN_trace_type_mail_model extends CN_base_model {
  constructor() {
    super({
      wording: {
        singular: "trace type mail template",
        plural: "trace type mail templates",
        posessive: "trace type mail template's",
      },
      columns: {
        trace_type: { column: "trace_type.name", title: "Trace Type" },
        language: { column: "language.name", title: "Language" },
        delay: { title: "Delay" },
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
