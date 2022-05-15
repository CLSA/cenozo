cenozoApp.defineModule({
  name: "trace_type",
  models: ["list", "view"],
  create: (module) => {
    angular.extend(module, {
      identifier: { column: "name" },
      name: {
        singular: "trace type",
        plural: "trace types",
        possessive: "trace type's",
      },
      columnList: {
        name: { title: "Name" },
        participant_count: {
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
      },
      description: {
        title: "Description",
        type: "text",
      },
    });
  },
});
