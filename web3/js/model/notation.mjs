import { CN_base_model } from "../base_model.mjs"

export class CN_notation_model extends CN_base_model {
  constructor() {
    super({
      wording: {
        singular: "notation",
        plural: "notations",
        posessive: "notation's",
      },
      columns: {
        subject: { title: "Subject" },
        type: { title: "Type" },
        description: { title: "Documentation", align: "left" },
      },
      properties: {
        subject: { title: "Subject", is_constant: () => true },
        type: { title: "Type", is_constant: () => true },
        description: { title: "Documentation", type: "text" },
      },
    });
  }

  /**
   * Notations can only be added directly in the UI
   */
  allow_add() {
    return false;
  }
}
