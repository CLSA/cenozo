cenozoApp.defineModule({
  name: "identifier",
  models: ["add", "list", "view"],
  create: (module) => {
    angular.extend(module, {
      identifier: { column: "name" },
      name: {
        singular: "identifier",
        plural: "identifiers",
        possessive: "identifier's",
      },
      columnList: {
        name: { title: "Name" },
        locked: { title: "Locked", type: "boolean" },
        regex: { title: "Format" },
        description: {
          title: "Description",
          type: "text",
          limit: 500,
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
      locked: {
        title: "Locked",
        type: "boolean",
        help: "If locked then participant identifiers cannot be added, changed or removed.",
      },
      regex: {
        title: "Format",
        type: "string",
        help: "This is a regular expression used to make sure all identifiers follow a particular format.",
      },
      description: {
        title: "Description",
        type: "text",
      },
    });

    module.addExtraOperation("view", {
      title: "Import Participant Identifiers",
      isDisabled: function ($state, model) {
        return model.viewModel.record.locked;
      },
      operation: async function ($state, model) {
        await $state.go("identifier.import", {
          identifier: model.viewModel.record.getIdentifier(),
        });
      },
    });

    /* ############################################################################################## */
    cenozo.providers.directive("cnIdentifierImport", [
      "CnIdentifierModelFactory",
      "CnSession",
      "$state",
      function (CnIdentifierModelFactory, CnSession, $state) {
        return {
          templateUrl: module.getFileUrl("import.tpl.html"),
          restrict: "E",
          scope: { model: "=?" },
          controller: async function ($scope) {
            if (angular.isUndefined($scope.model))
              $scope.model = CnIdentifierModelFactory.root;

            await $scope.model.viewModel.onView();

            CnSession.setBreadcrumbTrail([
              {
                title: "Identifiers",
                go: async function () {
                  return await $state.go("identifier.list");
                },
              },
              {
                title: $scope.model.viewModel.record.name,
                go: async function () {
                  return await $state.go("identifier.view", {
                    identifier: $scope.model.viewModel.record.getIdentifier(),
                  });
                },
              },
              {
                title: "Import Participant Identifiers",
              },
            ]);
          },
        };
      },
    ]);

    /* ############################################################################################## */
    cenozo.providers.factory("CnIdentifierViewFactory", [
      "CnBaseViewFactory",
      "CnHttpFactory",
      "$rootScope",
      "$state",
      function (CnBaseViewFactory, CnHttpFactory, $rootScope, $state) {
        var object = function (parentModel, root) {
          CnBaseViewFactory.construct(this, parentModel, root);

          angular.extend(this, {
            onView: async function (force) {
              await this.$$onView(force);

              if (angular.isDefined(this.participantIdentifierModel)) {
                var self = this;
                this.participantIdentifierModel.getDeleteEnabled = function () {
                  return this.$$getDeleteEnabled() && "identifier" == this.getSubjectFromState()
                    ? !self.record.locked
                    : false;
                };
              }
            },

            reset: function () {
              this.working = false;
              this.file = null;
              this.fileCheckResults = null;
            },

            cancel: async function () {
              this.reset();
              await $state.go("identifier.view", {
                identifier: this.record.getIdentifier(),
              });
            },

            checkImport: function () {
              // need to wait for cnUpload to do its thing
              var self = this;
              const removeFn = $rootScope.$on("cnUpload read", async function () {
                removeFn(); // only run once
                self.working = true;
                var data = new FormData();
                data.append("file", self.file);

                // check the imported file
                try {
                  var response = await CnHttpFactory.instance({
                    path:
                      self.parentModel.getServiceResourcePath() +
                      "?import=check",
                    data: self.file,
                  }).patch();

                  self.fileCheckResults = angular.fromJson(response.data);
                } finally {
                  self.working = false;
                }
              });
            },

            applyImport: async function () {
              // apply the patch file
              try {
                this.working = true;
                await CnHttpFactory.instance({
                  path:
                    this.parentModel.getServiceResourcePath() + "?import=apply",
                  data: this.file,
                }).patch();

                this.reset();
                $state.go("identifier.view", {
                  identifier: this.record.getIdentifier(),
                });
              } finally {
                this.working = false;
              }
            },
          });

          this.reset();
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
