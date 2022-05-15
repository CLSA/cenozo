cenozoApp.defineModule({
  name: "form_type",
  models: ["list", "view"],
  create: (module) => {
    angular.extend(module, {
      identifier: { column: "name" },
      name: {
        singular: "form type",
        plural: "form types",
        possessive: "form type's",
      },
      columnList: {
        title: { title: "Title" },
        form_count: {
          title: "Forms",
          type: "number",
        },
        description: {
          title: "Description",
          align: "left",
        },
      },
      defaultOrder: {
        column: "title",
        reverse: false,
      },
    });

    module.addInputGroup("", {
      name: {
        title: "Name",
        type: "string",
      },
      title: {
        title: "Title",
        type: "string",
      },
      description: {
        title: "Description",
        type: "text",
      },
    });
  },
});
