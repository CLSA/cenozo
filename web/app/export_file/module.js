cenozoApp.defineModule({
  name: "export_file",
  models: ["list", "view"],
  create: (module) => {
    angular.extend(module, {
      identifier: {
        parent: {
          subject: "export",
          column: "export.title",
        },
      },
      name: {
        singular: "export file",
        plural: "export files",
        possessive: "export file's",
      },
      columnList: {
        export: {
          column: "export.title",
          title: "Export Type",
        },
        user: {
          column: "user.name",
          title: "User",
        },
        size: {
          title: "Size",
          type: "size",
        },
        stage: {
          title: "Status",
          type: "string",
        },
        datetime: {
          title: "Date & Time",
          type: "datetime",
        },
      },
      defaultOrder: {
        column: "datetime",
        reverse: true,
      },
    });

    module.addInputGroup("", {
      user: {
        column: "user.name",
        title: "User",
        type: "string",
        isExcluded: "add",
        isConstant: true,
      },
      stage: {
        title: "Status",
        type: "string",
        isExcluded: "add",
        isConstant: true,
      },
      size: {
        title: "Size",
        type: "size",
        format: "float",
        isExcluded: "add",
        isConstant: true,
      },
      datetime: {
        title: "Date & Time",
        type: "datetimesecond",
        isExcluded: "add",
        isConstant: true,
      },
      formatted_elapsed: {
        title: "Elapsed",
        type: "string",
        format: "float",
        isExcluded: "add",
        isConstant: true,
      },
    });

    module.addExtraOperation("view", {
      title: "Download",
      operation: function ($state, model) {
        model.viewModel.downloadFile();
      },
      isDisabled: function ($state, model) {
        return (
          "completed" != model.viewModel.record.stage ||
          angular.isUndefined(model.viewModel.downloadFile)
        );
      },
    });

    /* ############################################################################################## */
    cenozo.providers.directive("cnExportFileView", [
      "CnExportFileModelFactory",
      "CnHttpFactory",
      "$interval",
      function (CnExportFileModelFactory, CnHttpFactory, $interval) {
        return {
          templateUrl: module.getFileUrl("view.tpl.html"),
          restrict: "E",
          scope: { model: "=?" },
          controller: function ($scope, $element) {
            if (angular.isUndefined($scope.model))
              $scope.model = CnExportFileModelFactory.root;
            var afterViewCompleted = false;

            // keep reloading the data until the export_file is either completed or failed (or the UI goes away)
            var promise = $interval(function () {
              if (
                "completed" == $scope.model.viewModel.record.stage ||
                "failed" == $scope.model.viewModel.record.stage
              ) {
                $interval.cancel(promise);
              } else {
                $scope.model.viewModel.onView(false);
              }
            }, 3000);
            $element.on("$destroy", function () {
              $interval.cancel(promise);
              afterViewCompleted = false;
            });

            $scope.model.viewModel.afterView(async function () {
              if (!afterViewCompleted) {
                // change the heading to the form's title
                var response = await CnHttpFactory.instance({
                  path:
                    "export/" + $scope.model.getParentIdentifier().identifier,
                  data: { select: { column: ["title"] } },
                }).get();
                $scope.model.viewModel.heading =
                  response.data.title + " Export File";
              }
            });
          },
        };
      },
    ]);

    /* ############################################################################################## */
    cenozo.providers.factory("CnExportFileListFactory", [
      "CnBaseListFactory",
      "CnHttpFactory",
      function (CnBaseListFactory, CnHttpFactory) {
        var object = function (parentModel) {
          CnBaseListFactory.construct(this, parentModel);

          // override transitionOnAdd since there are no parameters required when adding a new export file
          this.transitionOnAdd = async function () {
            var response = await CnHttpFactory.instance({
              path: this.parentModel.getServiceCollectionPath(),
              data: {},
            }).post();

            var self = this;
            await this.parentModel.transitionToViewState({
              getIdentifier: function () {
                return self.parentModel.getIdentifierFromRecord({
                  id: response.data,
                });
              },
            });
          };
        };
        return {
          instance: function (parentModel) {
            return new object(parentModel);
          },
        };
      },
    ]);

    /* ############################################################################################## */
    cenozo.providers.factory("CnExportFileViewFactory", [
      "CnBaseViewFactory",
      "CnHttpFactory",
      function (CnBaseViewFactory, CnHttpFactory) {
        var object = function (parentModel, root) {
          CnBaseViewFactory.construct(this, parentModel, root);

          var self = this;
          this.afterView(function () {
            if (angular.isUndefined(self.downloadFile)) {
              self.downloadFile = async function () {
                await CnHttpFactory.instance({
                  path: "export_file/" + self.record.getIdentifier(),
                  format: "csv",
                }).file();
              };
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

    /* ############################################################################################## */
    cenozo.providers.factory("CnExportFileModelFactory", [
      "CnBaseModelFactory",
      "CnExportFileListFactory",
      "CnExportFileViewFactory",
      function (
        CnBaseModelFactory,
        CnExportFileListFactory,
        CnExportFileViewFactory
      ) {
        var object = function (root) {
          CnBaseModelFactory.construct(this, module);
          this.listModel = CnExportFileListFactory.instance(this);
          this.viewModel = CnExportFileViewFactory.instance(this, root);

          // override getDeleteEnabled
          this.getDeleteEnabled = function () {
            return angular.isDefined(this.module.actions.delete);
          };

          // don't allow new export files until the parent's view has participants
          this.getAddEnabled = function () {
            return false;
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
