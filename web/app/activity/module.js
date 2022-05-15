cenozoApp.defineModule({
  name: "activity",
  models: "list",
  create: (module) => {
    angular.extend(module, {
      identifier: {}, // standard
      name: {
        singular: "activity",
        plural: "activities",
        possessive: "activity's",
      },
      columnList: {
        user: {
          column: "user.name",
          title: "User",
        },
        site: {
          column: "site.name",
          title: "Site",
        },
        role: {
          column: "role.name",
          title: "Role",
        },
        start_datetime: {
          title: "Start",
          type: "datetimesecond",
        },
        end_datetime: {
          title: "End",
          type: "datetimesecond",
        },
      },
      defaultOrder: {
        column: "start_datetime",
        reverse: true,
      },
    });
  },
});
