cenozoApp.defineModule({
  name: "event_type",
  models: ["add", "list", "view"],
  create: (module) => {
    angular.extend(module, {
      identifier: { column: "name" },
      name: {
        singular: "event type",
        plural: "event types",
        possessive: "event type's",
      },
      columnList: {
        name: { title: "Name" },
        event_count: {
          title: "Events",
          type: "number",
        },
        description: {
          title: "Description",
          align: "left",
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
      },
      record_address: {
        title: "Record Address",
        type: "boolean",
      },
      description: {
        title: "Description",
        type: "text",
      },
    });
  },
});
