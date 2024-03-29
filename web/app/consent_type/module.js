cenozoApp.defineModule({
  name: "consent_type",
  models: ["add", "list", "view"],
  create: (module) => {
    angular.extend(module, {
      identifier: { column: "name" },
      name: {
        singular: "consent type",
        plural: "consent types",
        possessive: "consent type's",
      },
      columnList: {
        name: {
          title: "Name",
          column: "consent_type.name",
        },
        accept_count: {
          title: "Accepts",
          type: "number",
        },
        deny_count: {
          title: "Denies",
          type: "number",
        },
        role_list: {
          title: "Roles",
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
        format: "identifier",
      },
      description: {
        title: "Description",
        type: "text",
      },
    });

    /* ############################################################################################## */
    cenozo.providers.factory("CnConsentTypeViewFactory", [
      "CnBaseViewFactory",
      function (CnBaseViewFactory) {
        var object = function (parentModel, root) {
          CnBaseViewFactory.construct(this, parentModel, root, "participant");

          async function init(object) {
            await object.deferred.promise;

            // allow roles to be added/removed
            if (angular.isDefined(object.roleModel)) {
              object.roleModel.getChooseEnabled = function () {
                return parentModel.getEditEnabled();
              };
            }

            if (angular.isDefined(object.participantModel)) {
              object.participantModel.addColumn(
                "accept",
                { title: "Accept", column: "consent.accept", type: "boolean" },
              );
              object.participantModel.addColumn(
                "datetime",
                { title: "Date & Time", column: "consent.datetime", type: "datetime" },
              );
            }
          }

          init(this);
        };
        return {
          instance: function (parentModel, root) {
            return new object(parentModel, root);
          },
        };
      },
    ]);
  },
});
