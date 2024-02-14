cenozoApp.defineModule({
  name: "log_entry",
  models: ["view", "list"],
  create: (module) => {
    angular.extend(module, {
      identifier: {}, // standard
      name: {
        singular: "log entry",
        plural: "log entries",
        possessive: "log entry's",
      },
      columnList: {
        application: {
          column: "application.title",
          title: "Application",
          isIncluded: function($state, model) {
            return model.showAllApplications();
          }
        },
        datetime: {
          title: "Date & Time",
          type: "datetimesecond",
        },
        type: { title: "Type", },
        user: { title: "User", },
        site: { title: "Site", },
        role: { title: "Role", },
        description: {
          title: "Description",
          type: "text",
          limit: 500,
          align: 'left',
        },
      },
      defaultOrder: {
        column: "datetime",
        reverse: true,
      },
    });

    module.addInputGroup("", {
      application: {
        column: "application.title",
        title: "Application",
        type: "string",
        isExcluded: function($state, model) {
          return model.showAllApplications();
        },
      },
      datetime: {
        title: "Date & Time",
        type: "datetime",
      },
      type: {
        title: "Type",
        type: "string",
      },
      user: {
        title: "User",
        type: "string",
      },
      role: {
        title: "Role",
        type: "string",
      },
      site: {
        title: "Site",
        type: "string",
      },
      service: {
        title: "Service",
        type: "string",
      },
      description: {
        title: "Description",
        type: "text",
      },
      stack_trace: {
        title: "Stack Trace",
        type: "text",
      },
    });

    module.addExtraOperation("list", {
      title: "Update Log",
      isIncluded: function($state, model) {
        return model.showAllApplications();
      },
      operation: async function ($state, model) {
        model.listModel.isLoading = true;
        try {
          await model.updateLog();
          await model.listModel.onList(true);
        } finally {
          model.listModel.isLoading = false;
        }
      },
    });

    cenozo.providers.factory("CnLogEntryModelFactory", [
      "CnBaseModelFactory",
      "CnLogEntryListFactory",
      "CnLogEntryViewFactory",
      "CnHttpFactory",
      "CnSession",
      function (CnBaseModelFactory, CnLogEntryListFactory, CnLogEntryViewFactory, CnHttpFactory, CnSession) {
        var object = function (root) {
          CnBaseModelFactory.construct(this, module);

          angular.extend(this, {
            listModel: CnLogEntryListFactory.instance(this),
            viewModel: CnLogEntryViewFactory.instance(this, root),

            updateLog: async function() {
              await CnHttpFactory.instance({ path: 'log_entry?update=1' }).query();
            },

            showAllApplications: function() {
              return "mastodon" == CnSession.application.name;
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
