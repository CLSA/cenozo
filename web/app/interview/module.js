cenozoApp.defineModule({
  name: "interview",
  models: ["list", "view"],
  defaultTab: "assignment",
  create: (module) => {
    angular.extend(module, {
      identifier: {
        parent: {
          subject: "participant",
          column: "participant.uid",
        },
      },
      name: {
        singular: "interview",
        plural: "interviews",
        possessive: "interview's",
      },
      columnList: {
        uid: {
          column: "participant.uid",
          title: "UID",
        },
        site: {
          column: "site.name",
          title: "Credited Site",
        },
        start_datetime: {
          title: "Start",
          type: "datetimesecond",
        },
        end_datetime: {
          title: "End",
          type: "datetimesecond",
        },
      },
      defaultOrder: {
        column: "start_datetime",
        reverse: true,
      },
    });

    module.addInputGroup("", {
      participant: {
        column: "participant.uid",
        title: "Participant",
        type: "string",
        isConstant: true,
      },
      site_id: {
        title: "Credited Site",
        type: "enum",
        help: "This determines which site is credited with the completed interview.",
        isConstant: function ($state, model) {
          return !model.isRole("administrator");
        },
      },
      start_datetime: {
        column: "interview.start_datetime",
        title: "Start Date & Time",
        type: "datetimesecond",
        max: "end_datetime",
        isConstant: function ($state, model) {
          return !model.isRole("administrator");
        },
        help: "When the first call from the first assignment was made for this interview.",
      },
      end_datetime: {
        column: "interview.end_datetime",
        title: "End Date & Time",
        type: "datetimesecond",
        min: "start_datetime",
        max: "now",
        isConstant: function ($state, model) {
          return !model.isRole("administrator");
        },
        help: "Will remain blank until the questionnaire is finished.",
      },
      note: {
        column: "interview.note",
        title: "Note",
        type: "text",
      },
    });

    if (angular.isDefined(cenozoApp.module("participant").actions.notes)) {
      module.addExtraOperation("view", {
        title: "Notes",
        operation: async function ($state, model) {
          await $state.go("participant.notes", {
            identifier: "uid=" + model.viewModel.record.participant,
          });
        },
      });
    }

    /* ############################################################################################## */
    cenozo.providers.factory("CnInterviewModelFactory", [
      "CnBaseModelFactory",
      "CnInterviewListFactory",
      "CnInterviewViewFactory",
      "CnSession",
      "CnHttpFactory",
      "CnModalMessageFactory",
      function (
        CnBaseModelFactory,
        CnInterviewListFactory,
        CnInterviewViewFactory,
        CnSession,
        CnHttpFactory,
        CnModalMessageFactory
      ) {
        var object = function (root) {
          CnBaseModelFactory.construct(this, module);
          this.listModel = CnInterviewListFactory.instance(this);
          this.viewModel = CnInterviewViewFactory.instance(this, root);

          // Adding an interview is special, instead of transitioning to an add dialog a command can be
          // sent to the server to directly add a new interview
          this.transitionToAddState = async function () {
            var self = this;
            await CnHttpFactory.instance({
              path: this.getServiceCollectionPath(),
              data: {}, // no record required, the server will fill in all necessary values
              onError: async function (error) {
                if (409 == error.status) {
                  // 409 when we can't add a new interview (explanation will be provided
                  await CnModalMessageFactory.instance({
                    title: "Unable To Add Interview",
                    message:
                      error.data +
                      " This is likely caused by the list being out of date so it will now be refreshed.",
                    error: true,
                  }).show();
                  self.listModel.onList(true);
                } else CnModalMessageFactory.httpError(error);
              },
            }).post();

            await this.listModel.onList(true);
          };

          // extend getMetadata
          this.getMetadata = async function () {
            await this.$$getMetadata();

            var response = await CnHttpFactory.instance({
              path: "site",
              data: {
                select: { column: ["id", "name"] },
                modifier: { order: "name", limit: 1000 },
              },
            }).query();
            this.metadata.columnList.site_id.enumList = response.data.reduce(
              (list, item) => {
                list.push({ value: item.id, name: item.name });
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
