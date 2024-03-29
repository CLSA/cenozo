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
        name: {
          title: "Name",
          column: "event_type.name",
        },
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
        format: "identifier",
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

            if (angular.isDefined(object.participantModel)) {
              object.participantModel.addColumn(
                "datetime",
                { title: "Date & Time", column: "event.datetime", type: "datetime" },
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
