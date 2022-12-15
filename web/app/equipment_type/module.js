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
        equipment_new_count: {
          title: "new",
          type: "number",
        },
        equipment_loaned_count: {
          title: "loaned",
          type: "number",
        },
        equipment_returned_count: {
          title: "returned",
          type: "number",
        },
        equipment_lost_count: {
          title: "lost",
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
