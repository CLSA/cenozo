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
    });
  },
});
