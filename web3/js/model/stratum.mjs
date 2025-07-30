import CN_timezones from "../timezones.mjs"

import { CN_base_model } from "../base_model.mjs"

export class CN_stratum_model extends CN_base_model {
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
          meta: true,
          title: "Total Participants",
          is_hidden: (model) => "add" == model.get_action_name(),
          is_constant: () => true,
          help: "The number of participants who belong to the stratum.",
        },
        eligible_count: {
          meta: true,
          title: "Eligible Participants",
          is_hidden: (model) => "add" == model.get_action_name(),
          is_constant: () => true,
          help: "The number of stratum participants who are eligible for the study.",
        },
        refused_count: {
          meta: true,
          title: "Refused Participants",
          is_hidden: (model) => "add" == model.get_action_name(),
          is_constant: () => true,
          help: "The number of stratum participants who refused the extra consent type.",
        },
        consented_count: {
          meta: true,
          title: "Consented Participants",
          is_hidden: (model) => "add" == model.get_action_name(),
          is_constant: () => true,
          help: "The number of stratum participants who accepted the extra consent type.",
        },
        completed_count: {
          meta: true,
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

// TODO: implement "Manage Participants" extra view operation
