cenozoApp.defineModule({
  name: "role",
  models: "list",
  create: (module) => {
    angular.extend(module, {
      identifier: {}, // standard
      name: {
        singular: "role",
        plural: "roles",
        possessive: "role's",
      },
      columnList: {
        name: {
          column: "role.name",
          title: "Name",
        },
        user_count: {
          title: "Users",
          type: "number",
        },
      },
      defaultOrder: {
        column: "name",
        reverse: false,
      },
    });

    /* ############################################################################################## */
    cenozo.providers.factory("CnRoleModelFactory", [
      "CnBaseModelFactory",
      "CnRoleListFactory",
      "CnSession",
      function (CnBaseModelFactory, CnRoleListFactory, CnSession) {
        var object = function (root) {
          CnBaseModelFactory.construct(this, module);
          this.listModel = CnRoleListFactory.instance(this);

          this.getServiceCollectionPath = function (ignoreParent) {
            return !ignoreParent && "application" == this.getSubjectFromState()
              ? "application_type/name=" + CnSession.application.type + "/role"
              : this.$$getServiceCollectionPath(ignoreParent);
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
