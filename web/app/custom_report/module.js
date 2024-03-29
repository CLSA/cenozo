cenozoApp.defineModule({
  name: "custom_report",
  models: ["add", "list", "view"],
  create: (module) => {
    angular.extend(module, {
      identifier: { column: "name" },
      name: {
        singular: "custom report",
        plural: "custom reports",
        possessive: "custom report's",
      },
      columnList: {
        name: { title: "Name" },
        description: {
          title: "Description",
          type: "text",
          align: "left",
          limit: 1024,
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
      data: {
        title: "SQL Report",
        type: "base64",
        mimeType: "text/sql",
        getFilename: function ($state, model) {
          return model.viewModel.record.name + ".sql";
        }
      },
      description: {
        title: "Description",
        type: "text",
      },
    });

    module.addExtraOperation("view", {
      title: "Download Report",
      operation: async function ($state, model) {
        await model.downloadReport(model.viewModel.record.getIdentifier());
      },
    });

    /* ############################################################################################## */
    cenozo.providers.factory("CnCustomReportModelFactory", [
      "CnBaseModelFactory",
      "CnCustomReportAddFactory",
      "CnCustomReportListFactory",
      "CnCustomReportViewFactory",
      "CnHttpFactory",
      "CnModalMessageFactory",
      function (
        CnBaseModelFactory,
        CnCustomReportAddFactory,
        CnCustomReportListFactory,
        CnCustomReportViewFactory,
        CnHttpFactory,
        CnModalMessageFactory
      ) {
        var object = function (root) {
          CnBaseModelFactory.construct(this, module);
          angular.extend(this, {
            addModel: CnCustomReportAddFactory.instance(this),
            listModel: CnCustomReportListFactory.instance(this),
            viewModel: CnCustomReportViewFactory.instance(this, root),

            downloadReport: async function(identifier) {
              const modal = CnModalMessageFactory.instance({
                title: "Please Wait",
                message: "Please wait while the report is generated.",
                block: true,
              });
              modal.show();

              try {
                await CnHttpFactory.instance({
                  path: "custom_report/" + identifier + "?file=report",
                  format: "csv"
                }).file();
              } finally {
                modal.close();
              }
            },

            // override transitionToViewState (used when interviewer views a document)
            transitionToViewState: async function (record) {
              if (!this.isRole("administrator")) {
                await this.downloadReport(record.getIdentifier());
              } else {
                await this.$$transitionToViewState(record);
              }
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
