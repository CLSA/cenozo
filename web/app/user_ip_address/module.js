cenozoApp.defineModule({
  name: "user_ip_address",
  models: "list",
  create: (module) => {
    angular.extend(module, {
      identifier: {}, // standard
      name: {
        singular: "login address",
        plural: "login addresses",
        possessive: "login address'",
      },
      columnList: {
        user: {
          column: "user.name",
          title: "User",
        },
        ip_address: {
          title: "IP Address",
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
