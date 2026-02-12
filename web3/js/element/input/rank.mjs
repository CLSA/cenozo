import CN_common from "../../common.mjs"
import { CN_input_enum } from "./enum.mjs"

export class CN_input_rank extends CN_input_enum {
  constructor(config = {}) {
    if (!CN_common.is_object(config)) {
      throw new Error("Non-object config argument passed to CN_input_rank contructor");
    }

    const cnf = {
      ...{
        // default config
        max_rank: 1,
      },
      ...config
    };

    // create the parent enum property based on the max_rank
    cnf.enum = {
      get_enums: async () => {
        const max_rank = Number(CN_common.is_function(cnf.max_rank) ? (await cnf.max_rank(this)) : cnf.max_rank);
        return [...Array(max_rank).keys()].map(i => ({
          key: i+1,
          value: CN_common.ordinal_suffix(i+1),
          disabled: false,
        }));
      },
    };

    super(cnf);
  }
}
