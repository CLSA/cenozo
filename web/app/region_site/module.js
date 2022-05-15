cenozoApp.defineModule({
  name: "region_site",
  models: ["add", "list", "view"],
  create: (module) => {
    angular.extend(module, {
      identifier: {}, // standard
      name: {
        singular: "region site",
        plural: "region sites",
        possessive: "region site's",
      },
      columnList: {
        site: {
          column: "site.name",
          title: "Site",
        },
        region: {
          column: "region.name",
          title: "Region",
        },
        language: {
          column: "language.name",
          title: "Language",
        },
      },
      defaultOrder: {
        column: "region",
        reverse: false,
      },
    });

    module.addInputGroup("", {
      site_id: {
        column: "region_site.site_id",
        title: "Site",
        type: "enum",
      },
      region_id: {
        column: "region_site.region_id",
        title: "Region",
        type: "enum",
      },
      language_id: {
        column: "region_site.language_id",
        title: "Language",
        type: "enum",
      },
    });

    /* ############################################################################################## */
    cenozo.providers.factory("CnRegionSiteModelFactory", [
      "CnBaseModelFactory",
      "CnRegionSiteListFactory",
      "CnRegionSiteAddFactory",
      "CnRegionSiteViewFactory",
      "CnHttpFactory",
      "CnSession",
      function (
        CnBaseModelFactory,
        CnRegionSiteListFactory,
        CnRegionSiteAddFactory,
        CnRegionSiteViewFactory,
        CnHttpFactory,
        CnSession
      ) {
        var object = function (root) {
          CnBaseModelFactory.construct(this, module);
          this.addModel = CnRegionSiteAddFactory.instance(this);
          this.listModel = CnRegionSiteListFactory.instance(this);
          this.viewModel = CnRegionSiteViewFactory.instance(this, root);

          // extend getMetadata
          this.getMetadata = async function () {
            await this.$$getMetadata();

            var [languageResponse, regionResponse, siteResponse] =
              await Promise.all([
                CnHttpFactory.instance({
                  path: "language",
                  data: {
                    select: { column: ["id", "name"] },
                    modifier: {
                      where: { column: "active", operator: "=", value: true },
                      order: "name",
                      limit: 1000,
                    },
                  },
                }).query(),

                CnHttpFactory.instance({
                  path: "region",
                  data: {
                    select: { column: ["id", "name"] },
                    modifier: {
                      join: {
                        table: "country",
                        onleft: "region.country_id",
                        onright: "country.id",
                      },
                      where: {
                        column: "country.name",
                        operator: "=",
                        value: CnSession.application.country,
                      },
                      order: "name",
                      limit: 1000,
                    },
                  },
                }).query(),

                CnHttpFactory.instance({
                  path: "application/0/site",
                  data: {
                    select: { column: ["id", "name"] },
                    modifier: { order: "name", limit: 1000 },
                  },
                }).query(),
              ]);

            this.metadata.columnList.language_id.enumList =
              languageResponse.data.reduce((list, item) => {
                list.push({ value: item.id, name: item.name });
                return list;
              }, []);

            this.metadata.columnList.region_id.enumList =
              regionResponse.data.reduce((list, item) => {
                list.push({ value: item.id, name: item.name });
                return list;
              }, []);

            this.metadata.columnList.site_id.enumList =
              siteResponse.data.reduce((list, item) => {
                list.push({ value: item.id, name: item.name });
                return list;
              }, []);
          };
        };

        return {
          root: new object(true),
          instance: function () {
            return new object(false);
          },
        };
      },
    ]);
  },
});
