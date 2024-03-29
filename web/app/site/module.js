cenozoApp.defineModule({
  name: "site",
  models: ["add", "list", "view"],
  create: (module) => {
    angular.extend(module, {
      identifier: { column: "name" },
      name: {
        singular: "site",
        plural: "sites",
        possessive: "site's",
        friendlyColumn: "name",
      },
      columnList: {
        name: {
          column: "site.name",
          title: "Name",
        },
        role_count: {
          title: "Roles",
          type: "number",
        },
        user_count: {
          title: "Users",
          type: "number",
        },
        participant_count: {
          title: "Participants",
          type: "number",
        },
        last_access_datetime: {
          title: "Last Access",
          type: "datetime",
        },
      },
      defaultOrder: {
        column: "name",
        reverse: false,
      },
    });

    module.addInputGroup("", {
      name: {
        title: "Name",
        type: "string",
        format: "identifier",
      },
      timezone: {
        title: "Time Zone",
        type: "typeahead",
        typeahead: moment.tz.names(),
      },
      title: {
        title: "Institution",
        type: "string",
      },
      phone_number: {
        title: "Phone Number",
        type: "string",
      },
      address1: {
        title: "Address1",
        type: "string",
      },
      address2: {
        title: "Address2",
        type: "string",
      },
      city: {
        title: "City",
        type: "string",
      },
      region_id: {
        title: "Region",
        type: "enum",
        isExcluded: "add",
        isConstant: true,
        help: "Cannot be changed once the site has been created.",
      },
      postcode: {
        title: "Postcode",
        type: "string",
        help: 'Must be in "A1A 1A1" format, zip codes in "01234" format.',
      },
    });

    try {
      var settingModule = cenozoApp.module("setting");
      if (angular.isDefined(settingModule.actions.view)) {
        module.addExtraOperation("view", {
          title: "Settings",
          operation: async function ($state, model) {
            await $state.go("setting.view", {
              identifier: "site_id=" + model.viewModel.record.id,
            });
          },
        });
      }
    } catch (err) {}

    /* ############################################################################################## */
    cenozo.providers.factory("CnSiteViewFactory", [
      "CnBaseViewFactory",
      function (CnBaseViewFactory) {
        var object = function (parentModel, root) {
          CnBaseViewFactory.construct(this, parentModel, root, "access");

          // extend the onPatch function
          this.onPatch = async function (data) {
            await this.$$onPatch(data);

            // when patching the postcode the region may change so update the view to reflect this
            if (angular.isDefined(data.postcode)) await this.onView();
          };
        };
        return {
          instance: function (parentModel, root) {
            return new object(parentModel, root);
          },
        };
      },
    ]);

    /* ############################################################################################## */
    cenozo.providers.factory("CnSiteModelFactory", [
      "CnBaseModelFactory",
      "CnSiteListFactory",
      "CnSiteAddFactory",
      "CnSiteViewFactory",
      "CnHttpFactory",
      function (
        CnBaseModelFactory,
        CnSiteListFactory,
        CnSiteAddFactory,
        CnSiteViewFactory,
        CnHttpFactory
      ) {
        var object = function (root) {
          CnBaseModelFactory.construct(this, module);
          this.addModel = CnSiteAddFactory.instance(this);
          this.listModel = CnSiteListFactory.instance(this);
          this.viewModel = CnSiteViewFactory.instance(this, root);

          // extend getMetadata
          this.getMetadata = async function () {
            await this.$$getMetadata();
            var response = await CnHttpFactory.instance({
              path: "region",
              data: {
                select: {
                  column: [
                    "id",
                    { table: "country", column: "name", alias: "country" },
                    {
                      column: 'CONCAT_WS( ", ", region.name, country.name )',
                      alias: "name",
                      table_prefix: false,
                    },
                  ],
                },
                modifier: { order: ["country.name", "name"], limit: 1000 },
              },
            }).query();
            this.metadata.columnList.region_id.enumList = response.data.reduce(
              (list, item) => {
                list.push({
                  value: item.id,
                  country: item.country,
                  name: item.name,
                });
                return list;
              },
              []
            );
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
