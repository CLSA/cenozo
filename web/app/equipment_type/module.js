cenozoApp.defineModule({
  name: "equipment_type",
  models: ["add", "list", "view"],
  create: (module) => {
    angular.extend(module, {
      identifier: { column: "name" },
      name: {
        singular: "equipment type",
        plural: "equipment types",
        possessive: "equipment type's",
      },
      columnList: {
        name: { title: "Name" },
        equipment_count: {
          title: "Inventory",
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
      description: {
        title: "Description",
        type: "text",
      },
    });
  },
});