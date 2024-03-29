cenozoApp.defineModule({
  name: "address",
  optionalDependencies: "trace",
  models: ["add", "list", "view"],
  create: (module) => {
    var useTrace = true;
    try {
      cenozoApp.module("trace");
    } catch (err) {
      useTrace = false;
    }

    angular.extend(module, {
      identifier: {
        parent: [
          {
            subject: "participant",
            column: "participant.uid",
          },
          {
            subject: "alternate",
            column: "alternate_id",
          },
        ],
      },
      name: {
        singular: "address",
        plural: "addresses",
        possessive: "address'",
        friendlyColumn: "rank",
      },
      columnList: {
        rank: {
          title: "Rank",
          type: "rank",
        },
        city: {
          title: "City",
        },
        region: {
          title: "Region",
        },
        active: {
          column: "address.active",
          title: "Active",
          type: "boolean",
        },
        available: {
          title: "Available",
          type: "boolean",
          help: "Whether the address is active in the current month.",
        },
      },
      defaultOrder: {
        column: "rank",
        reverse: false,
      },
    });

    module.addInputGroup("", {
      active: {
        title: "Active",
        type: "boolean",
      },
      rank: {
        title: "Rank",
        type: "rank",
      },
      international: {
        title: "International",
        type: "boolean",
        help: "Cannot be changed once the address has been created.",
        isConstant: "view",
      },
      address1: {
        title: "Address Line 1",
        type: "string",
      },
      address2: {
        title: "Address Line 2",
        type: "string",
      },
      city: {
        title: "City",
        type: "string",
      },
      region_id: {
        title: "Region",
        type: "enum",
        isExcluded: function ($state, model) {
          return angular.isUndefined(model.viewModel.record.international) ||
            model.viewModel.record.international
            ? true
            : "add";
        },
        isConstant: true,
        help: "The region cannot be changed directly, instead it is automatically updated based on the postcode.",
      },
      international_region: {
        title: "Region",
        type: "string",
        isExcluded: function ($state, model) {
          return (
            angular.isUndefined(model.viewModel.record.international) ||
            !model.viewModel.record.international
          );
        },
        help: "International regions are unrestricted and are not automatically set by the postcode.",
      },
      international_country_id: {
        title: "Country",
        type: "lookup-typeahead",
        typeahead: { table: "country" },
        isExcluded: function ($state, model) {
          return (
            angular.isUndefined(model.viewModel.record.international) ||
            !model.viewModel.record.international
          );
        },
      },
      postcode: {
        title: "Postcode",
        type: "string",
        help: 'Non-international postal codes must be in "A1A 1A1" format, zip codes in "01234" format.',
      },
      timezone_offset: {
        title: "Timezone Offset",
        type: "string",
        format: "float",
        isExcluded: "add",
        help: "The number of hours difference between the address' timezone and UTC.",
      },
      daylight_savings: {
        title: "Daylight Savings",
        type: "boolean",
        isExcluded: "add",
        help: "Whether the address observes daylight savings.",
      },
      note: {
        title: "Note",
        type: "text",
      },
      months: {
        title: "Active Months",
        type: "months",
      },
    });

    module.addExtraOperation("view", {
      title: "Use Timezone",
      operation: async function ($state, model) {
        await model.viewModel.onViewPromise;
        model.viewModel.useTimezone();
      },
    });

    /* ############################################################################################## */
    cenozo.providers.directive("cnAddressAdd", [
      "CnAddressModelFactory",
      function (CnAddressModelFactory) {
        return {
          templateUrl: module.getFileUrl("add.tpl.html"),
          restrict: "E",
          scope: { model: "=?" },
          controller: function ($scope) {
            if (angular.isUndefined($scope.model))
              $scope.model = CnAddressModelFactory.root;

            var cnRecordAddScope = null;
            $scope.$on(
              "cnRecordAdd ready",
              function (event, data) {
                cnRecordAddScope = data;

                // setup the international columns based on the international column's state
                var mainInputGroup =
                  $scope.model.module.inputGroupList.findByProperty(
                    "title",
                    ""
                  );
                mainInputGroup.inputList.international_region.isExcluded =
                  function ($state, model) {
                    return "add_address" == model.getActionFromState()
                      ? !cnRecordAddScope.record.international
                      : angular.isUndefined(
                          model.viewModel.record.international
                        ) || !model.viewModel.record.international;
                  };
                mainInputGroup.inputList.international_country_id.isExcluded =
                  function ($state, model) {
                    return "add_address" == model.getActionFromState()
                      ? !cnRecordAddScope.record.international
                      : angular.isUndefined(
                          model.viewModel.record.international
                        ) || !model.viewModel.record.international;
                  };
              },
              500
            );
          },
        };
      },
    ]);

    /* ############################################################################################## */
    var factoryArray = ["CnBaseAddFactory"];
    if (useTrace) factoryArray.push("CnTraceModelFactory");
    factoryArray.push(function (CnBaseAddFactory, CnTraceModelFactory) {
      var object = function (parentModel) {
        CnBaseAddFactory.construct(this, parentModel);
        if (useTrace) {
          var traceModel = CnTraceModelFactory.root;

          this.onAdd = async function (record) {
            var identifier = this.parentModel.getParentIdentifier();
            var traceResponse = await traceModel.checkForTraceResolvedAfterAddressAdded(identifier);
            if (traceResponse) {
              await this.$$onAdd(record);
              if (angular.isString(traceResponse))
                await traceModel.setTraceReason(identifier, traceResponse);
            } else {
              throw "Cancelled by user";
            }
          };
        }
      };
      return {
        instance: function (parentModel) {
          return new object(parentModel);
        },
      };
    });
    cenozo.providers.factory("CnAddressAddFactory", factoryArray);

    /* ############################################################################################## */
    var factoryArray = ["CnBaseListFactory"];
    if (useTrace) factoryArray.push("CnTraceModelFactory");
    factoryArray.push(function (CnBaseListFactory, CnTraceModelFactory) {
      var object = function (parentModel) {
        CnBaseListFactory.construct(this, parentModel);
        if (useTrace) {
          var traceModel = CnTraceModelFactory.root;

          this.onDelete = async function (record) {
            var identifier = {
              subject: this.parentModel.getSubjectFromState(),
              identifier: this.parentModel.getQueryParameter(
                "identifier",
                true
              ),
            };

            // only check for tracing if the record is active
            var traceResponse = record.active ?
              await traceModel.checkForTraceRequiredAfterAddressRemoved(identifier) :
              true;
            if (traceResponse) {
              await this.$$onDelete(record);
              if (angular.isString(traceResponse))
                return traceModel.setTraceReason(identifier, traceResponse);
            } else {
              throw "Cancelled by user";
            }
          };
        }
      };
      return {
        instance: function (parentModel) {
          return new object(parentModel);
        },
      };
    });
    cenozo.providers.factory("CnAddressListFactory", factoryArray);

    /* ############################################################################################## */
    var factoryArray = ["CnBaseViewFactory", "CnSession", "$state", "$window"];
    if (useTrace) factoryArray.push("CnTraceModelFactory");
    factoryArray.push(function (
      CnBaseViewFactory,
      CnSession,
      $state,
      $window,
      CnTraceModelFactory
    ) {
      var object = function (parentModel, root) {
        CnBaseViewFactory.construct(this, parentModel, root);
        if (useTrace) {
          var traceModel = CnTraceModelFactory.root;
          this.onViewPromise = null;

          this.onPatch = async function (data) {
            var identifier = this.parentModel.getParentIdentifier();
            var traceResponse = !angular.isDefined(data.active)
              ? true
              : data.active
              ? await traceModel.checkForTraceResolvedAfterAddressAdded(identifier)
              : await traceModel.checkForTraceRequiredAfterAddressRemoved(identifier);

            if (traceResponse) {
              await this.$$onPatch(data);
              if (angular.isString(traceResponse))
                return traceModel.setTraceReason(identifier, traceResponse);
              if (angular.isDefined(data.postcode)) await this.onView(true);
            } else {
              this.record.active = this.backupRecord.active;
            }
          };

          this.onDelete = async function () {
            var identifier = this.parentModel.getParentIdentifier();

            // only check for tracing if the record is active
            var traceResponse = this.record.active ?
              await traceModel.checkForTraceRequiredAfterAddressRemoved(identifier) :
              true;
            if (traceResponse) {
              await this.$$onDelete();
              if (angular.isString(traceResponse))
                return traceModel.setTraceReason(identifier, traceResponse);
            } else {
              throw "Cancelled by user";
            }
          };
        }

        this.useTimezone = async function () {
          await CnSession.setTimezone({ address_id: this.record.id });
          await $state.go("self.wait");
          $window.location.reload();
        };

        this.onView = function (force) {
          this.onViewPromise = this.$$onView(force);
          return this.onViewPromise;
        };
      };
      return {
        instance: function (parentModel, root) {
          return new object(parentModel, root);
        },
      };
    });
    cenozo.providers.factory("CnAddressViewFactory", factoryArray);

    /* ############################################################################################## */
    cenozo.providers.factory("CnAddressModelFactory", [
      "CnBaseModelFactory",
      "CnAddressListFactory",
      "CnAddressAddFactory",
      "CnAddressViewFactory",
      "CnHttpFactory",
      function (
        CnBaseModelFactory,
        CnAddressListFactory,
        CnAddressAddFactory,
        CnAddressViewFactory,
        CnHttpFactory
      ) {
        var object = function (root) {
          CnBaseModelFactory.construct(this, module);
          this.addModel = CnAddressAddFactory.instance(this);
          this.listModel = CnAddressListFactory.instance(this);
          this.viewModel = CnAddressViewFactory.instance(this, root);

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

            this.metadata.columnList.region_id.enumList = [];
            var self = this;
            response.data.forEach((item) =>
              self.metadata.columnList.region_id.enumList.push({
                value: item.id,
                country: item.country,
                name: item.name,
              })
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
