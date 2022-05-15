cenozoApp.defineModule({
  name: "stratum",
  dependencies: ["study"],
  models: ["add", "list", "view"],
  create: (module) => {
    angular.extend(module, {
      identifier: {
        parent: {
          subject: "study",
          column: "study.name",
        },
      },
      name: {
        singular: "stratum",
        plural: "strata",
        possessive: "strata's",
      },
      columnList: {
        name: { title: "Name" },
        participant_count: { title: "Participants", type: "number" },
        refused_count: { title: "Refused", type: "number" },
        consented_count: { title: "Consented", type: "number" },
        completed_count: { title: "Completed", type: "number" },
        description: {
          column: "stratum.description",
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
      name: { title: "Name", type: "string" },
      participant_count: {
        title: "Total Participants",
        type: "string",
        isConstant: true,
        isExcluded: "add",
      },
      refused_count: {
        title: "Total Refused Consent",
        type: "string",
        isConstant: true,
        isExcluded: "add",
      },
      consented_count: {
        title: "Total Accepted Consent",
        type: "string",
        isConstant: true,
        isExcluded: "add",
      },
      completed_count: {
        title: "Total Completed Event",
        type: "string",
        isConstant: true,
        isExcluded: "add",
      },
      description: { title: "Description", type: "text" },
    });

    module.addExtraOperation("view", {
      title: "Manage Participants",
      operation: async function ($state, model) {
        await $state.go("stratum.mass_participant", {
          identifier: model.viewModel.record.getIdentifier(),
        });
      },
      isIncluded: function ($state, model) {
        return model.getEditEnabled();
      },
    });

    /* ############################################################################################## */
    cenozo.providers.directive("cnStratumMassParticipant", [
      "CnStratumMassParticipantFactory",
      "CnSession",
      "$state",
      function (CnStratumMassParticipantFactory, CnSession, $state) {
        return {
          templateUrl: module.getFileUrl("mass_participant.tpl.html"),
          restrict: "E",
          scope: { model: "=?" },
          controller: async function ($scope) {
            if (angular.isUndefined($scope.model))
              $scope.model = CnStratumMassParticipantFactory.instance();

            await $scope.model.onLoad();

            CnSession.setBreadcrumbTrail([
              {
                title: "Strata",
                go: async function () {
                  await $state.go("stratum.list");
                },
              },
              {
                title: $scope.model.stratumName,
                go: async function () {
                  await $state.go("stratum.view", {
                    identifier: $scope.model.stratumId,
                  });
                },
              },
              {
                title: "Manage Participants",
              },
            ]);
          },
        };
      },
    ]);

    /* ############################################################################################## */
    cenozo.providers.factory("CnStratumMassParticipantFactory", [
      "CnSession",
      "CnHttpFactory",
      "CnModalMessageFactory",
      "CnParticipantSelectionFactory",
      "$state",
      function (
        CnSession,
        CnHttpFactory,
        CnModalMessageFactory,
        CnParticipantSelectionFactory,
        $state
      ) {
        var object = function () {
          angular.extend(this, {
            operation: "add",
            working: false,
            participantSelection: CnParticipantSelectionFactory.instance({
              path: ["stratum", $state.params.identifier, "participant"].join(
                "/"
              ),
              data: { mode: "confirm", operation: "add" },
            }),
            stratumId: $state.params.identifier,
            stratumName: null,

            onLoad: async function () {
              // reset data
              var response = await CnHttpFactory.instance({
                path: "stratum/" + this.stratumId,
                data: { select: { column: "name" } },
              }).get();

              this.stratumName = response.data.name;
              this.participantSelection.reset();
            },

            inputsChanged: function () {
              this.participantSelection.data.operation = this.operation;
              this.participantSelection.reset();
            },

            proceed: async function () {
              this.working = true;
              if (
                !this.participantSelection.confirmInProgress &&
                0 < this.participantSelection.confirmedCount
              ) {
                try {
                  var response = await CnHttpFactory.instance({
                    path: ["stratum", this.stratumId, "participant"].join("/"),
                    data: {
                      mode: "update",
                      identifier_id: this.participantSelection.identifierId,
                      identifier_list:
                        this.participantSelection.getIdentifierList(),
                      operation: this.operation,
                    },
                    onError: async function (error) {
                      await CnModalMessageFactory.httpError(error);
                      await $state.go("stratum.view", {
                        identifier: this.stratumId,
                      });
                    },
                  }).post();

                  await CnModalMessageFactory.instance({
                    title: "Participants Added",
                    message:
                      "You have successfully " +
                      ("add" == this.operation ? "added " : "removed ") +
                      this.participantSelection.confirmedCount +
                      " participant " +
                      ("add" == this.operation ? "to" : "from") +
                      ' the "' +
                      this.stratumName +
                      '" stratum.',
                  }).show();
                  await $state.go("stratum.view", {
                    identifier: this.stratumId,
                  });
                } finally {
                  this.working = false;
                }
              }
            },
          });
        };
        return {
          instance: function () {
            return new object();
          },
        };
      },
    ]);

    /* ############################################################################################## */
    cenozo.providers.factory("CnStratumViewFactory", [
      "CnBaseViewFactory",
      "CnSession",
      "CnHttpFactory",
      "CnModalMessageFactory",
      function (
        CnBaseViewFactory,
        CnSession,
        CnHttpFactory,
        CnModalMessageFactory
      ) {
        var object = function (parentModel, root) {
          CnBaseViewFactory.construct(this, parentModel, root, "participant");

          async function init(object) {
            await object.deferred.promise;
            if (angular.isDefined(object.participantModel)) {
              object.participantModel.getChooseEnabled = function () {
                return false;
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
  },
});
