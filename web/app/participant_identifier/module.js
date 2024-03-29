cenozoApp.defineModule({
  name: "participant_identifier",
  models: ["add", "list", "view"],
  create: (module) => {
    angular.extend(module, {
      identifier: {
        parent: [
          {
            subject: "identifier",
            column: "identifier.name",
          },
          {
            subject: "participant",
            column: "participant.uid",
          },
        ],
      },
      name: {
        singular: "participant identifier",
        plural: "participant identifiers",
        possessive: "participant identifier's",
      },
      columnList: {
        identifier: { column: "identifier.name", title: "Identifier" },
        uid: { column: "participant.uid", title: "UID" },
        value: { title: "Value" },
      },
      defaultOrder: {
        column: "participant.uid",
        reverse: false,
      },
    });

    module.addInputGroup("", {
      identifier_id: {
        column: "participant_identifier.identifier_id",
        title: "Identifier",
        type: "enum",
        isConstant: "view",
      },
      participant_id: {
        column: "participant_identifier.participant_id",
        title: "Participant",
        type: "lookup-typeahead",
        typeahead: {
          table: "participant",
          select:
            'CONCAT( participant.first_name, " ", participant.last_name, " (", uid, ")" )',
          where: ["participant.first_name", "participant.last_name", "uid"],
        },
      },
      value: {
        type: "string",
        title: "Value",
        format: "identifier",
      },
      locked: { column: "identifier.locked", type: "hidden" },
    });

    /* ############################################################################################## */
    cenozo.providers.factory("CnParticipantIdentifierModelFactory", [
      "CnBaseModelFactory",
      "CnParticipantIdentifierAddFactory",
      "CnParticipantIdentifierListFactory",
      "CnParticipantIdentifierViewFactory",
      "CnHttpFactory",
      function (
        CnBaseModelFactory,
        CnParticipantIdentifierAddFactory,
        CnParticipantIdentifierListFactory,
        CnParticipantIdentifierViewFactory,
        CnHttpFactory
      ) {
        var object = function (root) {
          CnBaseModelFactory.construct(this, module);
          angular.extend(this, {
            addModel: CnParticipantIdentifierAddFactory.instance(this),
            listModel: CnParticipantIdentifierListFactory.instance(this),
            viewModel: CnParticipantIdentifierViewFactory.instance(this, root),

            getEditEnabled: function () {
              return this.$$getEditEnabled() && !this.viewModel.record.locked;
            },

            getDeleteEnabled: function () {
              return this.$$getDeleteEnabled() &&
                     'participant' != this.getSubjectFromState() &&
                     !this.viewModel.record.locked;
            }, // is overridden by identifier module

            // extend getMetadata
            getMetadata: async function () {
              await this.$$getMetadata();

              var response = await CnHttpFactory.instance({
                path: "identifier",
                data: {
                  select: { column: ["id", "name"] },
                  modifier: { order: "name", limit: 1000 },
                },
              }).query();

              this.metadata.columnList.identifier_id.enumList =
                response.data.reduce((list, item) => {
                  list.push({
                    value: item.id,
                    name: item.name,
                  });
                  return list;
                }, []);
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
