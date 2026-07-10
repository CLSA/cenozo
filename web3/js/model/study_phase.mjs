import { CN_action_view } from "../action/view.mjs"
import { CN_api } from "../api.mjs"
import { CN_base_model } from "./base_model.mjs"
import { CN_common } from "../common.mjs"
import { CN_session } from "../session.mjs"

export class CN_model_study_phase extends CN_base_model {
  constructor() {
    super({
      wording: {
        singular: "study phase",
        plural: "study phases",
        posessive: "study phase's",
      },
      columns: {
        study: { column: "study.name", title: "Study" },
        rank: { title: "Rank", type: "rank" },
        name: { title: "Name" },
        code: { title: "Code" },
        identifier: { column: "identifier.name", title: "Identifier" },
      },
      properties: {
        name: { title: "Name", format: "identifier" },
        code: { title: "Code", format: "identifier" },
        rank: { title: "Rank", type: "rank" },
        identifier_id: {
          title: "Special Identifier",
          type: "enum",
          enum: { path: "identifier" },
          is_hidden: () => 3 > CN_session.get("role", "tier"),
          help: "The special identifier used by this study-phase.",
        },
        enable_status: { meta: { table: "study", column: "enable_status" }, is_hidden: () => true },
      },
    });
  }

  /**
   * Returns a typeahead object for models that have a typeahead property referencing this model
   * @return object
   * @static
   */
  static get_typeahead(params = {}) {
    return {
      get_list: async (value) => {
        const api_params = CN_common.merge_objects({
          select: {
            column: [
              { column: "id", alias: "key" },
              { column: 'CONCAT( study.name, ": ", study_phase.name )', alias: "value" },
            ],
          },
          modifier: {
            where: [
              { column: "study.name", operator: "like", value: `%${value}%` },
              { column: "study_phase.name", operator: "like", value: `%${value}%`, or: true },
            ],
            order: 'CONCAT( study.name, ": ", study_phase.name )',
            limit: 20,
          },
        }, params);
        return await CN_api.get("study_phase", api_params);
      },
    };
  }
}

export class CN_view_study_phase extends CN_action_view {
  /**
   * Extends parent method
   */
  get_selector_child_list() {
    const child_list = super.get_selector_child_list();
    return (
      !this.get_property_value("enable_status") ?
      child_list.filter(child => "study_phase_status" != child.model.get_name()) :
      child_list
    );
  }
}
