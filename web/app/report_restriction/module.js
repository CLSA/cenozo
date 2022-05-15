cenozoApp.defineModule({
  name: "report_restriction",
  models: ["add", "list", "view"],
  create: (module) => {
    angular.extend(module, {
      identifier: {
        parent: {
          subject: "report_type",
          column: "report_type.name",
        },
      },
      name: {
        singular: "report restriction",
        plural: "report restrictions",
        possessive: "report restriction's",
        friendlyColumn: "rank",
      },
      columnList: {
        report_type: {
          column: "report_type.name",
          title: "Report Type",
        },
        rank: {
          title: "Rank",
          type: "rank",
        },
        title: {
          title: "Heading",
          type: "string",
        },
        restriction_type: {
          title: "Type",
          type: "string",
        },
        mandatory: {
          title: "Mandatory",
          type: "boolean",
        },
        null_allowed: {
          title: "Null Allowed",
          type: "boolean",
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
      title: {
        title: "Heading",
        type: "string",
      },
      restriction_type: {
        title: "Type",
        type: "enum",
      },
      custom: {
        title: "Custom",
        type: "boolean",
      },
      subject: {
        title: "Subject",
        type: "string",
      },
      operator: {
        title: "Operator",
        type: "enum",
      },
      mandatory: {
        title: "Mandatory",
        type: "boolean",
      },
      null_allowed: {
        title: "Null Allowed",
        type: "boolean",
      },
      description: {
        title: "Description",
        type: "text",
      },
    });
  },
});
