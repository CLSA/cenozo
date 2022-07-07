cenozoApp.defineModule({
  name: "study_phase",
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
        singular: "study phase",
        plural: "study phases",
        possessive: "study phase's",
      },
      columnList: {
        study: { column: "study.name", title: "Study" },
        rank: { title: "Rank", type: "rank" },
        name: { title: "Name" },
        code: { title: "Code" },
        identifier: { column: "identifier.name", title: "Identifier" },
      },
      defaultOrder: {
        column: "study.name",
        reverse: false,
      },
    });

    module.addInputGroup("", {
      name: {
        title: "Name",
        type: "string",
      },
      code: {
        title: "Code",
        type: "string",
      },
      rank: {
        title: "Rank",
        type: "rank",
      },
      identifier_id: {
        title: "Special Identifier",
        type: "enum",
        isExcluded: function ($state, model) {
          return !model.isRole("administrator");
        },
        help: "The special identifier used by this study-phase.",
      },
    });

    /* ############################################################################################## */
    cenozo.providers.factory("CnStudyPhaseModelFactory", [
      "CnBaseModelFactory",
      "CnStudyPhaseAddFactory",
      "CnStudyPhaseListFactory",
      "CnStudyPhaseViewFactory",
      "CnHttpFactory",
      function (
        CnBaseModelFactory,
        CnStudyPhaseAddFactory,
        CnStudyPhaseListFactory,
        CnStudyPhaseViewFactory,
        CnHttpFactory
      ) {
        var object = function (root) {
          CnBaseModelFactory.construct(this, module);
          this.addModel = CnStudyPhaseAddFactory.instance(this);
          this.listModel = CnStudyPhaseListFactory.instance(this);
          this.viewModel = CnStudyPhaseViewFactory.instance(this, root);

          this.getMetadata = async function () {
            await this.$$getMetadata();

            if (this.isRole("administrator")) {
              var response = await CnHttpFactory.instance({
                path: "identifier",
                data: {
                  select: { column: ["id", "name"] },
                  modifier: { order: "name", limit: 1000 },
                },
              }).query();

              this.metadata.columnList.identifier_id.enumList =
                response.data.reduce((list, item) => {
                  list.push({ value: item.id, name: item.name });
                  return list;
                }, []);
            }
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
