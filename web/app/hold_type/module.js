cenozoApp.defineModule({
  name: "hold_type",
  models: ["add", "list", "view"],
  create: (module) => {
    angular.extend(module, {
      identifier: { column: ["type", "name"] },
      name: {
        singular: "hold type",
        plural: "hold types",
        possessive: "hold type's",
      },
      columnList: {
        type: { column: "hold_type.type", title: "Type" },
        name: { column: "hold_type.name", title: "Name" },
        participant_count: {
          title: "Participants",
          type: "number",
        },
        role_list: {
          title: "Roles",
        },
      },
      defaultOrder: {
        column: 'CONCAT( hold_type.type, " ", hold_type.name )',
        reverse: false,
      },
    });

    module.addInputGroup("", {
      type: {
        title: "Type",
        type: "enum",
      },
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
    cenozo.providers.factory("CnHoldTypeViewFactory", [
      "CnBaseViewFactory",
      function (CnBaseViewFactory) {
        var object = function (parentModel, root) {
          CnBaseViewFactory.construct(this, parentModel, root, "participant");

          async function init(object) {
            // allow add/delete of roles and participants
            await object.deferred.promise;

            if (angular.isDefined(object.roleModel))
              object.roleModel.getChooseEnabled = function () {
                return parentModel.getEditEnabled();
              };
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
