cenozoApp.defineModule({
  name: "availability_type",
  models: ["add", "list", "view"],
  create: (module) => {
    angular.extend(module, {
      identifier: { column: "name" },
      name: {
        singular: "availability type",
        plural: "availability types",
        possessive: "availability type's",
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
        format: "identifier",
      },
      participant_count: {
        title: "Participants",
        type: "string",
        isConstant: true,
        isExcluded: 'add',
        help: "Participants can only be added to this availability type by going directly to participant details.",
      },
    });
  },
});
