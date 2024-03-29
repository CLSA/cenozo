cenozoApp.defineModule({
  name: "relation",
  dependencies: "relation_type",
  models: ["add", "list"],
  create: (module) => {
    angular.extend(module, {
      identifier: {
        parent: {
          subject: "participant",
          column: "participant.uid",
        },
      },
      name: {
        singular: "relationship",
        plural: "relationships",
        possessive: "relationship's",
      },
      columnList: {
        primary_uid: {
          column: "primary_participant.uid",
          title: "Index UID",
        },
        primary_first_name: {
          column: "primary_participant.first_name",
          title: "Index First Name",
        },
        primary_last_name: {
          column: "primary_participant.last_name",
          title: "Index Last Name",
        },
        uid: {
          column: "participant.uid",
          title: "UID",
        },
        first_name: {
          column: "participant.first_name",
          title: "First Name",
        },
        last_name: {
          column: "participant.last_name",
          title: "Last Name",
        },
        full_relation_type: {
          title: "Relationship Type",
        },
        participant_id: { type: "hidden" }
      },
      defaultOrder: {
        column: "relation_type.name",
        reverse: false,
      },
    });

    module.addInputGroup("", {
      primary_participant_id: {
        column: "primary_participant.id",
        title: "Index Participant",
        type: "lookup-typeahead",
        typeahead: {
          table: "participant",
          select: 'CONCAT( participant.first_name, " ", participant.last_name, " (", uid, ")" )',
          where: ["participant.first_name", "participant.last_name", "uid"],
        },
        isConstant: function ($state, model) {
          return "participant" == model.getSubjectFromState();
        },
      },
      participant_id: {
        column: "participant.id",
        title: "Related Participant",
        type: "lookup-typeahead",
        typeahead: {
          table: "participant",
          select: 'CONCAT( participant.first_name, " ", participant.last_name, " (", uid, ")" )',
          where: ["participant.first_name", "participant.last_name", "uid"],
        },
      },
      relation_type_id: {
        title: "Relation Type",
        type: "enum",
      },
    });

    /* ############################################################################################## */
    cenozo.providers.factory("CnRelationListFactory", [
      "CnBaseListFactory",
      "$state",
      function (CnBaseListFactory, $state) {
        var object = function (parentModel) {
          CnBaseListFactory.construct(this, parentModel);

          this.onSelect = function (record) {
            $state.go("participant.view", { identifier: record.participant_id });
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
    cenozo.providers.factory("CnRelationModelFactory", [
      "CnBaseModelFactory",
      "CnRelationAddFactory",
      "CnRelationListFactory",
      "CnHttpFactory",
      function (
        CnBaseModelFactory,
        CnRelationAddFactory,
        CnRelationListFactory,
        CnHttpFactory
      ) {
        var object = function (root) {
          CnBaseModelFactory.construct(this, module);
          angular.extend(this, {
            addModel: CnRelationAddFactory.instance(this),
            listModel: CnRelationListFactory.instance(this),

            getAddEnabled: function() {
              // Need to override parent method since we don't care if the role doesn't have edit access
              // on the parent model
              return angular.isDefined(this.module.actions.add);
            },

            getDataArray: function (removeList, type) {
              // override the default behaviour for list types if the parent state is participant
              var stateSubject = this.getSubjectFromState();

              if ("list" != type || "participant" != stateSubject) return this.$$getDataArray(removeList, type);

              var data = [];
              for (var key in this.columnList) {
                if (!removeList.includes(key) &&
                    // don't include hidden columns
                    "hidden" != this.columnList[key].type &&
                    // if the parent is participant then don't include the primary participant
                    !key.match( /^primary_/ )
                ){
                  data.push(this.columnList[key]);
                }
              }

              return data;
            },

            getAddEnabled: function() {
              // don't allow adding relations when viewing a participant that is not the primary
              if ("participant" == this.getSubjectFromState()) {
                // TODO: implement
              }
              return this.$$getAddEnabled();
            },

            // extend getMetadata
            getMetadata: async function () {
              await this.$$getMetadata();

              const [relationTypeResponse, siteResponse] = await Promise.all([
                await CnHttpFactory.instance({
                  path: "relation_type",
                  data: {
                    select: { column: ["id", "name"] },
                    modifier: { order: "name", limit: 1000 },
                  },
                }).query(),
              ]);

              this.metadata.columnList.relation_type_id.enumList = [];
              relationTypeResponse.data.forEach((item) => {
                this.metadata.columnList.relation_type_id.enumList.push({
                  value: item.id,
                  name: item.name,
                });
              });
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
