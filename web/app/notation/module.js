cenozoApp.defineModule({
  name: "notation",
  models: ["list", "view"],
  create: (module) => {
    angular.extend(module, {
      identifier: {},
      name: {
        singular: "notation",
        plural: "notations",
        possessive: "notation's",
      },
      columnList: {
        subject: { title: "Subject" },
        type: { title: "Type" },
        description: { title: "Documentation", align: "left" },
      },
      defaultOrder: {
        column: "subject",
        reverse: false,
      },
    });

    module.addInputGroup("", {
      subject: {
        title: "Subject",
        type: "string",
        isConstant: true,
      },
      type: {
        title: "type",
        type: "string",
        isConstant: true,
      },
      description: {
        title: "Documentation",
        type: "text",
      },
    });

    /* ############################################################################################## */
    cenozo.providers.factory("CnNotationModelFactory", [
      "CnBaseModelFactory",
      "CnNotationListFactory",
      "CnNotationViewFactory",
      "CnHttpFactory",
      function (
        CnBaseModelFactory,
        CnNotationListFactory,
        CnNotationViewFactory,
        CnHttpFactory
      ) {
        var object = function (root) {
          CnBaseModelFactory.construct(this, module);
          this.listModel = CnNotationListFactory.instance(this);
          this.viewModel = CnNotationViewFactory.instance(this, root);

          // override the default - notations can only be added directly in the UI
          this.getAddEnabled = function() { return false; };
        };

        return {
          root: new object(true),
          instance: function () {
            return new object(false);
          },
        };
      },
    ]);
  },
});
