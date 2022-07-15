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
      record_address: {
        title: "Record Address",
        type: "boolean",
      },
      description: {
        title: "Description",
        type: "text",
      },
    });
    
    /* ############################################################################################## */
    cenozo.providers.factory("CnEventTypeViewFactory", [
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
