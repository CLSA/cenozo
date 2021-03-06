cenozoApp.defineModule({
  name: "application_type",
  models: "list",
  create: (module) => {
    angular.extend(module, {
      identifier: { column: "name" },
      name: {
        singular: "application type",
        plural: "application types",
        possessive: "application type's",
      },
      columnList: {
        name: { title: "Name" },
      },
      defaultOrder: {
        column: "name",
        reverse: false,
      },
    });

    /* ############################################################################################## */
    cenozo.providers.factory("CnApplicationTypeModelFactory", [
      "CnBaseModelFactory",
      "CnApplicationTypeListFactory",
      "CnHttpFactory",
      function (
        CnBaseModelFactory,
        CnApplicationTypeListFactory,
        CnHttpFactory
      ) {
        var object = function (root) {
          var self = this;
          CnBaseModelFactory.construct(this, module);
          this.listModel = CnApplicationTypeListFactory.instance(this);
          this.getViewEnabled = function () {
            return false;
          };
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
