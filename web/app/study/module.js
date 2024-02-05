cenozoApp.defineModule({
  name: "study",
  models: ["add", "list", "view"],
  defaultTab: "study_phase",
  create: (module) => {
    angular.extend(module, {
      identifier: { column: "name" },
      name: {
        singular: "study",
        plural: "studies",
        possessive: "study's",
      },
      columnList: {
        name: {
          title: "Name",
          column: "study.name",
        },
        consent_type: { column: "consent_type.name", title: "Consent Type" },
        completed_event_type: {
          column: "event_type.name",
          title: "Completed Event Type",
        },
        description: {
          column: "study.description",
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
      consent_type_id: {
        title: "Extra Consent Type",
        type: "enum",
        help: "If selected then participants have withdrawn from the study when this consent-type is negative.",
      },
      completed_event_type_id: {
        title: "Completed Event Type",
        type: "enum",
        help: "If selected then this event-type identifies when the study is complete.",
      },
      description: {
        title: "Description",
        type: "text",
      },
    });

    /* ############################################################################################## */
    cenozo.providers.factory("CnStudyViewFactory", [
      "CnBaseViewFactory",
      "CnSession",
      function (CnBaseViewFactory, CnSession) {
        var object = function (parentModel, root) {
          CnBaseViewFactory.construct(this, parentModel, root, "address");

          async function init(object) {
            await object.deferred.promise;

            if (angular.isDefined(object.participantModel)) {
              object.participantModel.getChooseEnabled = function () {
                return parentModel.getEditEnabled();
              };
            }
          }

          init(this);
        };

        return {
          instance: function (parentModel, root) {
            return new object(parentModel, root);
          },
        };
      },
    ]);

    /* ############################################################################################## */
    cenozo.providers.factory("CnStudyModelFactory", [
      "CnBaseModelFactory",
      "CnStudyListFactory",
      "CnStudyAddFactory",
      "CnStudyViewFactory",
      "CnHttpFactory",
      function (
        CnBaseModelFactory,
        CnStudyListFactory,
        CnStudyAddFactory,
        CnStudyViewFactory,
        CnHttpFactory
      ) {
        var object = function (root) {
          CnBaseModelFactory.construct(this, module);
          this.addModel = CnStudyAddFactory.instance(this);
          this.listModel = CnStudyListFactory.instance(this);
          this.viewModel = CnStudyViewFactory.instance(this, root);

          // extend getMetadata
          this.getMetadata = async function () {
            await this.$$getMetadata();

            var promiseList = [
              CnHttpFactory.instance({
                path: "consent_type",
                data: {
                  select: { column: ["id", "name"] },
                  modifier: { order: "name", limit: 1000 },
                },
              }).query(),

              CnHttpFactory.instance({
                path: "event_type",
                data: {
                  select: { column: ["id", "name"] },
                  modifier: { order: "name", limit: 1000 },
                },
              }).query(),
            ];

            var [consentTypeResponse, eventTypeResponse] =
              await Promise.all(promiseList);

            this.metadata.columnList.consent_type_id.enumList =
              consentTypeResponse.data.reduce((list, item) => {
                list.push({ value: item.id, name: item.name });
                return list;
              }, []);

            this.metadata.columnList.completed_event_type_id.enumList =
              eventTypeResponse.data.reduce((list, item) => {
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
