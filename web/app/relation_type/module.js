cenozoApp.defineModule({
  name: "relation_type",
  models: ["list", "view"],
  create: (module) => {
    angular.extend(module, {
      identifier: { column: "name" },
      name: {
        singular: "relationship type",
        plural: "relationship types",
        possessive: "relationship type's",
      },
      columnList: {
        rank: { title: "Rank" },
        name: { title: "Name" },
        relation_count: {
          title: "Participants",
          type: "number",
        },
      },
      defaultOrder: {
        column: "rank",
        reverse: false,
      },
    });

    module.addInputGroup("", {
      rank: {
        title: "Rank",
        type: "rank",
      },
      name: {
        title: "Name",
        type: "string",
        format: "identifier",
      },
    });
  },
});
