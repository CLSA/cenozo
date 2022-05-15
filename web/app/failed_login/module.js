cenozoApp.defineModule({
  name: "failed_login",
  models: "list",
  create: (module) => {
    angular.extend(module, {
      identifier: {}, // standard
      name: {
        singular: "failed login",
        plural: "failed logins",
        possessive: "failed login's",
      },
      columnList: {
        user: {
          column: "user.name",
          title: "User",
        },
        application: {
          column: "application.title",
          title: "Application",
        },
        address: {
          title: "Address",
        },
        datetime: {
          title: "Date & Time",
          type: "datetimesecond",
        },
      },
      defaultOrder: {
        column: "datetime",
        reverse: true,
      },
    });
  },
});
