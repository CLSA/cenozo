cenozoApp.defineModule({
  name: "relation",
  dependencies: "relation_type",
  models: ["list"],
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
        column: "relation_type.rank",
        reverse: false,
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
      "CnRelationListFactory",
      "CnHttpFactory",
      function (
        CnBaseModelFactory,
        CnRelationListFactory,
        CnHttpFactory
      ) {
        var object = function (root) {
          CnBaseModelFactory.construct(this, module);
          angular.extend(this, {
            listModel: CnRelationListFactory.instance(this),

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
