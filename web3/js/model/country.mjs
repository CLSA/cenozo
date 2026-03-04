import { CN_api } from "../api.mjs"

import { CN_base_model } from "./base_model.mjs"

export class CN_country_model extends CN_base_model {
  /**
   * Returns a typeahead object for models that have a typeahead property referencing this model
   * @return object
   * @static
   */
  static get_typeahead() {
    return {
      get_list: async (value) => {
        return await CN_api.get("country", {
          select: {
            column: [
              { column: "id", alias: "key" },
              { column: "name", alias: "value" },
            ],
          },
          modifier: {
            where: { column: "name", operator: "like", value: `%${value}%` },
            order: 'name',
          },
        });
      },
    };
  }
}
