cenozoApp.defineModule({
  name: "event_type_mail",
  models: ["add", "list", "view"],
  create: (module) => {
    angular.extend(module, {
      identifier: {
        parent: {
          subject: "event_type",
          column: "event_type.name",
        },
      },
      name: {
        singular: "mail template",
        plural: "mail templates",
        possessive: "mail template's",
      },
      columnList: {
        to_address: {
          column: "event_type_mail.to_address",
          title: "To",
        },
        cc_address: {
          column: "event_type_mail.cc_address",
          title: "CC",
        },
        subject: {
          column: "event_type_mail.subject",
          title: "Subject",
        },
      },
      defaultOrder: {
        column: "event_type_mail.subject",
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
