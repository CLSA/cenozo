cenozoApp.defineModule({
  name: "recording",
  models: ["add", "list", "view"],
  create: (module) => {
    angular.extend(module, {
      identifier: { column: "rank" },
      name: {
        singular: "recording",
        plural: "recordings",
        possessive: "recording'",
      },
      columnList: {
        rank: {
          title: "Rank",
          type: "rank",
        },
        name: {
          title: "Name",
        },
        record: {
          title: "Record",
          type: "boolean",
        },
        timer: {
          title: "Timer",
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
      },
      record: {
        title: "Record",
        type: "boolean",
        help: "Whether the participant should be recorded during this stage.",
      },
      timer: {
        title: "Timer",
        type: "string",
        format: "integer",
        minValue: 1,
        help: "The number of seconds to limit the stage to (empty meaning no limit)",
      },
    });
  },
});
