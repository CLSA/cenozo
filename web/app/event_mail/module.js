cenozoApp.defineModule({
  name: "event_mail",
  models: ["list", "view"],
  create: (module) => {
    angular.extend(module, {
      identifier: {
        parent: {
          subject: "event",
          column: "event.id",
        },
      },
      name: {
        singular: "sent mail",
        plural: "sent mail",
        possessive: "sent mail's",
      },
      columnList: {
        to_address: {
          column: "event_mail.to_address",
          title: "To",
        },
        cc_address: {
          column: "event_mail.cc_address",
          title: "CC",
        },
        datetime: {
          column: "event_mail.datetime",
          title: "Date & Time",
          type: "datetimesecond",
        },
        subject: {
          column: "event_mail.subject",
          title: "Subject",
        },
        sent: {
          column: "event_mail.sent",
          title: "Sent",
          type: "boolean",
        }
      },
      defaultOrder: {
        column: "event_mail.datetime",
        reverse: true,
      },
    });

    module.addInputGroup("", {
      to_address: {
        title: "To",
        type: "string",
      },
      cc_address: {
        title: "CC",
        type: "string",
      },
      datetime: {
        title: "Date & Time",
        type: "datetimesecond",
      },
      sent: {
        title: "Sent",
        type: "boolean",
      },
      subject: {
        title: "Subject",
        type: "string",
      },
      body: {
        title: "Body",
        type: "text",
      },
    });
  },
});
