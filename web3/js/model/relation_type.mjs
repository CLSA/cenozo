import { CN_api } from "../api.mjs"
import { CN_base_model } from "./base_model.mjs"
import { CN_session } from "../session.mjs"

export class CN_relation_type_model extends CN_base_model {
  constructor() {
    super({
      wording: {
        singular: "relationship type",
        plural: "relationship types",
        posessive: "relationship type's",
      },
      columns: {
        rank: { title: "Rank", type: "rank" },
        name: { title: "Name" },
        relation_count: { title: "Participants", type: "number", table_prefix: false },
      },
      properties: {
        name: { title: "Name", format: "identifier" },
        rank: { title: "Rank", type: "rank" },
      },
    });
  }
}
