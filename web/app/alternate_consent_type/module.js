cenozoApp.defineModule({
  name: "alternate_consent_type",
  models: ["add", "list", "view"],
  create: (module) => {
    angular.extend(module, {
      identifier: { column: "name" },
      name: {
        singular: "alternate consent type",
        plural: "alternate consent types",
        possessive: "alternate consent type's",
      },
      columnList: {
        name: { title: "Name" },
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
      },
      description: {
        title: "Description",
        type: "text",
      },
    });

    /* ############################################################################################## */
    cenozo.providers.factory("CnAlternateConsentTypeViewFactory", [
      "CnBaseViewFactory",
      function (CnBaseViewFactory) {
        var object = function (parentModel, root) {
          CnBaseViewFactory.construct(this, parentModel, root, "alternate");

          async function init(object) {
            await object.deferred.promise;

            // allow roles to be added/removed
            if (angular.isDefined(object.roleModel)) {
              object.roleModel.getChooseEnabled = function () {
                return parentModel.getEditEnabled();
              };
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
