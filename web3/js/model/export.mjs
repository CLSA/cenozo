import CN_api from "../api.mjs"
import CN_element from "../element.mjs"
import CN_session from "../session.mjs"

import { CN_base_model } from "../base_model.mjs"
import { CN_base_view } from "../base_view.mjs"

export class CN_export_model extends CN_base_model {
  constructor() {
    super({
      wording: {
        singular: "export",
        plural: "exports",
        posessive: "export's",
      },
      columns: {
        title: { column: "export.title", title: "Title" },
        user: { column: "user.name", title: "Owner" },
        description: { column: "export.description", title: "Description", type: "text" },
      },
      properties: {
        title: { title: "Title", format: "identifier" },
        user_id: {
          title: "Owner",
          type: "typeahead",
          typeahead: {
            get_list: async (value) => {
              return await CN_api.get("user", {
                select: {
                  column: [{
                    table: "user",
                    column: "id",
                    alias: "key",
                  }, {
                    table: "user",
                    column: 'CONCAT(user.first_name," ",user.last_name," (",user.name,")")',
                    alias: "value",
                    table_prefix: false,
                  }],
                },
                modifier: {
                  where: [
                    { column: "user.first_name", operator: "like", value: `%${value}%`, },
                    { column: "user.last_name", operator: "like", value: `%${value}%`, or: true },
                    { column: "user.name", operator: "like", value: `%${value}%`, or: true },
                  ],
                  order: 'CONCAT(user.first_name," ",user.last_name," (",user.name,")")',
                },
              });
            },
          },
          is_hidden: model => "add" == model.get_action_name(),
        },
        description: { title: "Description", type: "text" },
      },
    });
  }
}

export class CN_export_view extends CN_base_view {
  /**
   * Add operations to the footer element
   */
  create_footer_element() {
    const footer_el = super.create_footer_element();

    // add the generate action
    const generate_btn_el = CN_element.create(
      '<button name="generate" type="button" class="btn btn-light btn-outline-primary">Generate</button>'
    );
    generate_btn_el.addEventListener("click", async () => {
      // create a new export_file then navigate to the returned ID
      const model = this.get_model();
      const response = await CN_api.post(`${model.get_view_url(null, "api")}/export_file`);
      await CN_session.navigate_to(`${model.get_view_url()}/export_file/view/${response}`);
    });
    footer_el.append(generate_btn_el);

    // add the duplicate action
    const duplicate_btn_el = CN_element.create(
      '<button name="duplicate" type="button" class="btn btn-light btn-outline-primary">Duplicate</button>'
    );
    duplicate_btn_el.addEventListener("click", async () => {
      // duplicate the export on the server side then navigate to the returned ID
      const model = this.get_model();
      const response = await CN_api.post(
        `${model.get_base_path("api")}?duplicate_export_id=${model.get_identifier()}`
      );
      await CN_session.navigate_to(model.get_view_url(response));
    });
    footer_el.append(duplicate_btn_el);

    return footer_el;
  }
}
