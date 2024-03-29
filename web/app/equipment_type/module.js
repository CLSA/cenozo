cenozoApp.defineModule({
  name: "equipment_type",
  models: ["add", "list", "view"],
  create: (module) => {
    angular.extend(module, {
      identifier: { column: "name" },
      name: {
        singular: "equipment type",
        plural: "equipment types",
        possessive: "equipment type's",
      },
      columnList: {
        name: { title: "Name" },
        equipment_count: {
          title: "Inventory",
          type: "number",
        },
        equipment_new_count: {
          title: "new",
          type: "number",
        },
        equipment_loaned_count: {
          title: "loaned",
          type: "number",
        },
        equipment_returned_count: {
          title: "returned",
          type: "number",
        },
        equipment_lost_count: {
          title: "lost",
          type: "number",
        },
        description: {
          title: "Description",
          align: "left",
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
      regex: {
        title: "Format",
        type: "string",
      },
      description: {
        title: "Description",
        type: "text",
      },
    });

    module.addExtraOperation("view", {
      title: "Upload Data",
      operation: async function ($state, model) {
        await $state.go(
          "equipment_type.upload",
          { identifier: model.viewModel.record.getIdentifier() }
        );
      },
    });

    cenozo.providers.directive("cnEquipmentTypeUpload", [
      "CnEquipmentTypeModelFactory",
      "CnSession",
      "$state",
      function (CnEquipmentTypeModelFactory, CnSession, $state) {
        return {
          templateUrl: module.getFileUrl("upload.tpl.html"),
          restrict: "E",
          scope: { model: "=?" },
          controller: async function ($scope) {
            if (angular.isUndefined($scope.model)) $scope.model = CnEquipmentTypeModelFactory.root;

            await $scope.model.viewModel.onView();
            $scope.model.viewModel.summary = null;

            CnSession.setBreadcrumbTrail([{
              title: "Equipment Types",
              go: async function() { await $state.go("equipment_type.list"); },
            }, {
              title: $scope.model.viewModel.record.name,
              go: async function () {
                await $state.go("equipment_type.view", {
                  identifier: $scope.model.viewModel.record.getIdentifier(),
                });
              }
            }, {
              title: "Upload Data",
            }]);
          },
        };
      }
    ]);

    /* ############################################################################################## */
    cenozo.providers.factory("CnEquipmentTypeViewFactory", [
      "CnBaseViewFactory",
      "CnHttpFactory",
      "CnModalMessageFactory",
      "$state",
      "$rootScope",
      function (
        CnBaseViewFactory,
        CnHttpFactory,
        CnModalMessageFactory,
        $state,
        $rootScope
      ) {
        var object = function (parentModel, root) {
          CnBaseViewFactory.construct( this, parentModel, root );

          angular.extend(this, {
            working: false,
            file: null,
            summary: null,

            cancel: async function () {
              this.summary = null;
              await $state.go("equipment_type.view", { identifier: this.record.getIdentifier() });
            },

            checkData: function () {
              // need to wait for cnUpload to do its thing
              const removeFn = $rootScope.$on("cnUpload read", async () => {
                removeFn(); // only run once
                try {
                  this.working = true;
                  var data = new FormData();
                  data.append("file", this.file);

                  // check the data file
                  var response = await CnHttpFactory.instance({
                    path: this.parentModel.getServiceResourcePath() + "?action=check",
                    data: this.file,
                  }).patch();

                  this.summary = response.data;
                } finally {
                  this.working = false;
                }
              });
            },
            applyData: async function() {
              try {
                // apply the data file
                this.working = true;
                await CnHttpFactory.instance({
                  path: this.parentModel.getServiceResourcePath() + "?action=apply",
                  data: this.file,
                }).patch();
                await $state.go("equipment_type.view", {
                  identifier: this.record.getIdentifier(),
                });
              } finally {
                this.working = false;
              }
            }
          });
        };
        return {
          instance: function (parentModel, root) {
            return new object(parentModel, root);
          },
        };
      },
    ]);
  },
});
