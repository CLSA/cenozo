cenozoApp.defineModule({
  name: "cohort",
  models: "list",
  create: (module) => {
    angular.extend(module, {
      identifier: { column: "name" },
      name: {
        singular: "cohort",
        plural: "cohorts",
        possessive: "cohort's",
      },
      columnList: {
        name: {
          column: "cohort.name",
          title: "Name",
        },
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
  },
});
