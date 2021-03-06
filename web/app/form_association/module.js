cenozoApp.defineModule({
  name: "form_association",
  models: "list",
  create: (module) => {
    angular.extend(module, {
      identifier: {
        parent: {
          subject: "form",
          column: "form.id",
        },
      },
      name: {
        singular: "form association",
        plural: "form associations",
        possessive: "form association's",
      },
      columnList: {
        subject: {
          title: "Subject",
          type: "string",
        },
        record_id: {
          title: "Record ID",
          type: "string",
        },
      },
      defaultOrder: {
        column: "subject",
        reverse: false,
      },
    });

    /* ############################################################################################## */
    cenozo.providers.factory("CnFormAssociationListFactory", [
      "CnBaseListFactory",
      "CnModalMessageFactory",
      "$state",
      function (CnBaseListFactory, CnModalMessageFactory, $state) {
        var object = function (parentModel) {
          CnBaseListFactory.construct(this, parentModel);

          this.onSelect = function (record) {
            var subjectModule = cenozoApp.module(record.subject);
            if (angular.isUndefined(subjectModule.actions.view)) {
              CnModalMessageFactory.instance({
                title: "Permission Denied",
                message: "You do not have access to the requested resource.",
                error: true,
              }).show();
            } else {
              $state.go(record.subject + ".view", {
                identifier: record.record_id,
              });
            }
          };
        };
        return {
          instance: function (parentModel) {
            return new object(parentModel);
          },
        };
      },
    ]);

    /* ############################################################################################## */
    cenozo.providers.factory("CnFormAssociationModelFactory", [
      "CnBaseModelFactory",
      "CnFormAssociationListFactory",
      function (CnBaseModelFactory, CnFormAssociationListFactory) {
        var object = function (root) {
          var self = this;
          CnBaseModelFactory.construct(this, module);
          this.listModel = CnFormAssociationListFactory.instance(this);

          // allow viewing (list model will redirect to linked record)
          this.getViewEnabled = function () {
            return true;
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
