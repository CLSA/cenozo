cenozoApp.defineModule({
  name: "relation_type",
  models: ["add", "list", "view"],
  create: (module) => {
    angular.extend(module, {
      identifier: { column: "name" },
      name: {
        singular: "relationship type",
        plural: "relationship types",
        possessive: "relationship type's",
      },
      columnList: {
        name: { title: "Name" },
        relation_count: {
          title: "Participants",
          type: "number",
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
    });
  },
});
