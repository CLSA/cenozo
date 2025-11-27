const { CN_base_model } = await import(`${CENOZO_URL}/js/base_model.mjs`);

export class CN_setting_model extends CN_base_model {
  constructor() {
    super({
      wording: {
        singular: "setting",
        plural: "settings",
        posessive: "setting's",
      },
      columns: {
        site: { column: "site.name", title: "Site" },
      },
      properties: {
        site: {
          meta: { table: "site", column: "name" },
          title: "Site",
          is_constant: () => true,
        },
      },
    });
  }
}
