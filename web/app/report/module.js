cenozoApp.defineModule({
  name: "report",
  models: ["add", "list", "view"],
  create: (module) => {
    angular.extend(module, {
      identifier: {
        parent: {
          subject: "report_type",
          column: "report_type.name",
        },
      },
      name: {
        singular: "report",
        plural: "reports",
        possessive: "report's",
      },
      columnList: {
        report_type: {
          column: "report_type.name",
          title: "Report Type",
        },
        report_schedule: {
          title: "Automatic",
          type: "boolean",
        },
        user: {
          column: "user.name",
          title: "User",
        },
        site: {
          column: "site.name",
          title: "Site",
        },
        role: {
          column: "role.name",
          title: "Role",
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
      report_schedule: {
        title: "Automatically Generated",
        type: "boolean",
        isExcluded: "add",
        isConstant: true,
      },
      user: {
        column: "user.name",
        title: "User",
        type: "string",
        isExcluded: "add",
        isConstant: true,
      },
      site: {
        column: "site.name",
        title: "Site",
        type: "string",
        isExcluded: "add",
        isConstant: true,
      },
      role: {
        column: "role.name",
        title: "Role",
        type: "string",
        isExcluded: "add",
        isConstant: true,
      },
      format: {
        title: "Format",
        type: "enum",
        isConstant: "view",
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

    module.addInputGroup(
      "Parameters",
      { restrict_placeholder: { type: "hidden" } },
      false
    );

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
    cenozo.providers.directive("cnReportAdd", [
      "CnReportModelFactory",
      "CnHttpFactory",
      function (CnReportModelFactory, CnHttpFactory) {
        return {
          templateUrl: module.getFileUrl("add.tpl.html"),
          restrict: "E",
          scope: { model: "=?" },
          controller: async function ($scope) {
            if (angular.isUndefined($scope.model))
              $scope.model = CnReportModelFactory.root;
            $scope.model.setupBreadcrumbTrail();

            var cnRecordAddScope = null;
            $scope.$on("cnRecordAdd ready", async function (event, data) {
              cnRecordAddScope = data;

              // we have to call getMetadata again to update the restriction columns in case they changed
              await $scope.model.getMetadata();

              cnRecordAddScope.dataArray = $scope.model.getDataArray([], "add");
              var parameters = cnRecordAddScope.dataArray.findByProperty(
                "title",
                "Parameters"
              );
              if (
                null != parameters &&
                angular.isArray(parameters.inputArray)
              ) {
                parameters.inputArray.forEach((input) => {
                  if (cenozo.isDatetimeType(input.type))
                    cnRecordAddScope.formattedRecord[input.key] = "(empty)";
                });
              }
            });

            // change the heading to the form's title
            var response = await CnHttpFactory.instance({
              path:
                "report_type/" + $scope.model.getParentIdentifier().identifier,
              data: { select: { column: ["title"] } },
            }).get();

            $scope.model.addModel.heading =
              "Run " + response.data.title + " Report";
          },
        };
      },
    ]);

    /* ############################################################################################## */
    cenozo.providers.directive("cnReportView", [
      "CnReportModelFactory",
      "CnHttpFactory",
      "$interval",
      function (CnReportModelFactory, CnHttpFactory, $interval) {
        return {
          templateUrl: module.getFileUrl("view.tpl.html"),
          restrict: "E",
          scope: { model: "=?" },
          controller: function ($scope, $element) {
            if (angular.isUndefined($scope.model))
              $scope.model = CnReportModelFactory.root;
            var afterViewCompleted = false;

            var cnRecordViewScope = null;
            $scope.$on("cnRecordView ready", async function (event, data) {
              cnRecordViewScope = data;

              await $scope.model.metadata.getPromise();
              cnRecordViewScope.dataArray = $scope.model.getDataArray(
                [],
                "view"
              );
            });

            // keep reloading the data until the report is either completed or failed (or the UI goes away)
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
                    "report_type/" +
                    $scope.model.getParentIdentifier().identifier,
                  data: { select: { column: ["title"] } },
                }).get();
                $scope.model.viewModel.heading =
                  response.data.title + " Report Details";
              }
            });
          },
        };
      },
    ]);

    /* ############################################################################################## */
    cenozo.providers.factory("CnReportAddFactory", [
      "CnBaseAddFactory",
      "CnModalMessageFactory",
      function (CnBaseAddFactory, CnModalMessageFactory) {
        var object = function (parentModel) {
          CnBaseAddFactory.construct(this, parentModel);

          angular.extend(this, {
            // transition to viewing the new record instead of the default functionality
            transitionOnSave: function (record) {
              parentModel.transitionToViewState(record);
            },

            onNew: async function (record) {
              await this.$$onNew(record);

              // if we don't call getMetadata again then the format enum may not be filled out
              await this.parentModel.getMetadata();

              for (var column in this.parentModel.metadata.columnList) {
                var meta = this.parentModel.metadata.columnList[column];
                if (angular.isDefined(meta.restriction_type)) {
                  if (cenozo.isDatetimeType(meta.restriction_type))
                    record[column] = null;
                  else if ("boolean" == meta.restriction_type && meta.required)
                    record[column] = true;
                }
              }
            },

            onAddError: function (response) {
              if (306 == response.status) {
                CnModalMessageFactory.instance({
                  title: "Please Note",
                  message: response.data,
                }).show();
              } else this.$$onAddError(response);
            },
          });
        };
        return {
          instance: function (parentModel) {
            return new object(parentModel);
          },
        };
      },
    ]);

    /* ############################################################################################## */
    cenozo.providers.factory("CnReportViewFactory", [
      "CnBaseViewFactory",
      "CnHttpFactory",
      function (CnBaseViewFactory, CnHttpFactory) {
        var object = function (parentModel, root) {
          CnBaseViewFactory.construct(this, parentModel, root);

          // extend onView
          this.onView = async function (updateRestrictions) {
            if (angular.isUndefined(updateRestrictions))
              updateRestrictions = true;

            if (!updateRestrictions)
              var recordBackup = angular.copy(this.record);

            await this.$$onView();
            if (updateRestrictions) {
              // get the report restriction values
              var response = await CnHttpFactory.instance({
                path:
                  "report/" +
                  this.record.getIdentifier() +
                  "/report_restriction",
                data: {
                  select: { column: ["name", "value", "restriction_type"] },
                  modifier: { order: { rank: false } },
                },
              }).query();
              response.data.forEach((restriction) => {
                var key = "restrict_" + restriction.name;
                if ("table" == restriction.restriction_type) {
                  this.record[key] =
                    "_NULL_" == restriction.value
                      ? restriction.value
                      : parseInt(restriction.value);
                } else if ("boolean" == restriction.restriction_type) {
                  this.record[key] = "1" == restriction.value;
                } else {
                  this.record[key] = restriction.value;
                }
                this.updateFormattedRecord(
                  key,
                  cenozo.getTypeFromRestriction(restriction)
                );
              });
            } else {
              for (var column in recordBackup) {
                if ("restrict_" == column.substring(0, 9)) {
                  this.record[column] = recordBackup[column];
                  this.updateFormattedRecord(
                    column,
                    this.parentModel.module.getInput(column).type
                  );
                }
              }
            }

            var parameterData =
              this.parentModel.module.inputGroupList.findByProperty(
                "title",
                "Parameters"
              );
            Object.keys(parameterData.inputList)
              .filter((column) => "restrict_" == column.substring(0, 9))
              .forEach((column) => {
                var type = parameterData.inputList[column].type;
                if (angular.isDefined(this.record[column])) {
                  this.updateFormattedRecord(column, type);
                } else if (cenozo.isDatetimeType(type)) {
                  this.formattedRecord[column] = "(empty)";
                } else if ("boolean" == type) {
                  this.record[column] = "";
                }
              });
          };

          var self = this;
          this.afterView(function () {
            if (angular.isUndefined(self.downloadFile)) {
              self.downloadFile = async function () {
                var format = "csv";
                if ("Excel" == self.record.format) format = "xlsx";
                else if ("LibreOffice" == self.record.format) format = "ods";

                await CnHttpFactory.instance({
                  path: "report/" + self.record.getIdentifier(),
                  format: format,
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
    cenozo.providers.factory("CnReportModelFactory", [
      "CnBaseModelFactory",
      "CnReportListFactory",
      "CnReportAddFactory",
      "CnReportViewFactory",
      "CnHttpFactory",
      function (
        CnBaseModelFactory,
        CnReportListFactory,
        CnReportAddFactory,
        CnReportViewFactory,
        CnHttpFactory
      ) {
        var object = function (root) {
          CnBaseModelFactory.construct(this, module);
          this.addModel = CnReportAddFactory.instance(this);
          this.listModel = CnReportListFactory.instance(this);
          this.viewModel = CnReportViewFactory.instance(this, root);

          angular.extend(this, {
            reportTypeIdentifier: null,

            // override getDeleteEnabled
            getDeleteEnabled: function () {
              return angular.isDefined(this.module.actions.delete);
            },

            // extend getMetadata
            getMetadata: async function () {
              var reportTypeIdentifier = this.getParentIdentifier().identifier;

              // don't use the parent identifier when in the view state, it doesn't work
              if ("view" == this.getActionFromState()) {
                var reportTypeResponse = await CnHttpFactory.instance({
                  path: this.getServiceResourcePath(),
                  data: { select: { column: ["report_type_id"] } },
                }).get();
                reportTypeIdentifier = reportTypeResponse.data.report_type_id;
              }

              if (this.reportTypeIdentifier != reportTypeIdentifier) {
                this.reportTypeIdentifier = reportTypeIdentifier;
                var parameterData = this.module.inputGroupList.findByProperty(
                  "title",
                  "Parameters"
                );
                parameterData.inputList = {};

                await this.$$getMetadata();

                // remove the parameter group's input list and metadata
                for (var column in this.metadata.columnList)
                  if ("restrict_" == column.substring(0, 9))
                    delete this.metadata.columnList[column];

                var reportRestrictionResponse = await CnHttpFactory.instance({
                  path:
                    "report_type/" +
                    this.reportTypeIdentifier +
                    "/report_restriction",
                  data: { modifier: { order: { rank: false } } },
                }).get();

                // replace all restrictions from the module and metadata
                for (var restriction of reportRestrictionResponse.data) {
                  var key = "restrict_" + restriction.name;
                  var input = await cenozo.getInputFromRestriction(
                    restriction,
                    CnHttpFactory
                  );
                  parameterData.inputList[key] = input;
                  this.metadata.columnList[key] = {
                    required: restriction.mandatory,
                    restriction_type: restriction.restriction_type,
                  };
                  if (angular.isDefined(input.enumList))
                    this.metadata.columnList[key].enumList = input.enumList;
                }
              } else {
                await CnHttpFactory.instance({ path: "self/0" }).get();
              }
            },

            getServiceData: function (type, columnRestrictLists) {
              // remove restrict_* columns from service data's select.column array
              var data = this.$$getServiceData(type, columnRestrictLists);
              data.select.column = data.select.column.filter(
                (column) => (
                  (angular.isString(column) && "restrict_" != column.substring(0, 9)) ||
                  (angular.isObject(column) && "restrict_" != column.column.substring(0, 9))
                )
              );
              return data;
            },
          });
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
