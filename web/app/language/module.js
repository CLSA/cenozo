cenozoApp.defineModule({
  name: "language",
  models: ["list", "view"],
  create: (module) => {
    angular.extend(module, {
      identifier: { column: "code" },
      name: {
        singular: "language",
        plural: "languages",
        possessive: "language's",
      },
      columnList: {
        name: { title: "Name" },
        code: { title: "Code" },
        active: {
          column: "language.active",
          title: "Active",
          type: "boolean",
        },
        participant_count: {
          title: "Participants",
          type: "number",
        },
        user_count: {
          title: "Users",
          type: "number",
        },
      },
      defaultOrder: {
        column: "active",
        reverse: true,
      },
    });

    module.addInputGroup("", {
      name: {
        title: "Name",
        type: "string",
        isConstant: true,
      },
      code: {
        title: "Code",
        type: "string",
        isConstant: true,
      },
      active: {
        title: "Active",
        type: "boolean",
        help: "Setting this to yes will make this language appear in language lists.",
      },
      participant_count: {
        title: "Participants",
        type: "string",
        isConstant: true,
        help: "Participants can only be added to this language by going directly to participant details.",
      },
    });
  },
});
