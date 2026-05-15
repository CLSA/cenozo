import { CN_action_list } from "../action/list.mjs"
import { CN_base_model } from "./base_model.mjs"
import { CN_model_participant } from "./participant.mjs"
import { CN_session } from "../session.mjs"

export class CN_model_relation extends CN_base_model {
  constructor() {
    super({
      wording: {
        singular: "relationship",
        plural: "relationships",
        posessive: "relationship's",
      },
      columns: {
        primary_uid: {
          column: "primary_participant.uid",
          title: "Index UID",
          is_hidden: (model) => {
            const parent_model = this.get_parent_model();
            return parent_model && "participant" == parent_model.get_name();
          },
        },
        primary_first_name: {
          column: "primary_participant.first_name",
          title: "Index First Name",
          is_hidden: (model) => {
            const parent_model = this.get_parent_model();
            return parent_model && "participant" == parent_model.get_name();
          },
        },
        primary_last_name: {
          column: "primary_participant.last_name",
          title: "Index Last Name",
          is_hidden: (model) => {
            const parent_model = this.get_parent_model();
            return parent_model && "participant" == parent_model.get_name();
          },
        },
        uid: {
          column: "participant.uid",
          title: "UID",
          is_hidden: (model) => false,
        },
        first_name: {
          column: "participant.first_name",
          title: "First Name",
          is_hidden: (model) => false,
        },
        last_name: {
          column: "participant.last_name",
          title: "Last Name",
          is_hidden: (model) => false,
        },
        full_relation_type: {
          title: "Relationship Type",
          table_prefix: false,
          is_hidden: (model) => false,
        },
        participant_id: { is_hidden: () => true } // used in CN_list_relation.on_row_click method below
      },
      properties: {
        participant_id: {
          title: "Related Participant",
          type: "typeahead",
          typeahead: CN_model_participant.get_typeahead(),
          get_default: () => null,
        },
        relation_type_id: {
          title: "Relationship Type",
          type: "enum",
          enum: { path: "relation_type" },
        },
      },
    });
  }

  /**
   * Replace parent method
   */
  allow_add() {
    const parent_model = this.get_parent_model();
    if (!parent_model || "participant" != parent_model.get_name()) return false;

    return (
      "add" == this.get_action_name() || (
        "list" == this.get_action_name() &&
        true === parent_model.get_action().get_property_value("is_primary_relation")
      )
    );
  }
}

export class CN_list_relation extends CN_action_list {
  /**
   * Extend parent method to make clicking on relation bring you to the participant
   */
  async on_row_click(record) {
    if (this.is_choosing()) {
      await super.on_row_click(record);
    } else {
      await CN_session.navigate_to(`participant/view/${record.participant_id}?tab=relation`);
    }
  }
}
