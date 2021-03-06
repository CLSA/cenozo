cenozoApp.defineModule({
  name: "access",
  models: ["add", "list"],
  create: (module) => {
    angular.extend(module, {
      identifier: {
        parent: [
          {
            subject: "site",
            column: "site.name",
          },
          {
            subject: "user",
            column: "user.name",
          },
        ],
      },
      name: {
        singular: "access",
        plural: "accesses",
        possessive: "access'",
      },
      columnList: {
        username: {
          column: "user.name",
          title: "User",
        },
        firstname: {
          column: "user.first_name",
          title: "First Name",
        },
        lastname: {
          column: "user.last_name",
          title: "Last Name",
        },
        role: {
          column: "role.name",
          title: "Role",
        },
        site: {
          column: "site.name",
          title: "Site",
        },
        datetime: {
          title: "Last Used",
          type: "datetimesecond",
        },
      },
      defaultOrder: {
        column: "username",
        reverse: false,
      },
    });

    module.addInputGroup("", {
      user_id: {
        title: "User",
        type: "lookup-typeahead",
        typeahead: {
          table: "user",
          select:
            'CONCAT( user.first_name, " ", user.last_name, " (", user.name, ")" )',
          where: ["user.first_name", "user.last_name", "user.name"],
        },
      },
      role_id: {
        title: "Role",
        type: "enum",
      },
      site_id: {
        title: "Site",
        type: "enum",
      },
    });

    /* ############################################################################################## */
    cenozo.providers.factory("CnAccessModelFactory", [
      "CnBaseModelFactory",
      "CnAccessListFactory",
      "CnAccessAddFactory",
      "CnHttpFactory",
      function (
        CnBaseModelFactory,
        CnAccessListFactory,
        CnAccessAddFactory,
        CnHttpFactory
      ) {
        var object = function (root) {
          CnBaseModelFactory.construct(this, module);
          this.addModel = CnAccessAddFactory.instance(this);
          this.listModel = CnAccessListFactory.instance(this);

          // extend getMetadata
          this.getMetadata = async function () {
            var self = this;
            await this.$$getMetadata();

            var [roleResponse, siteResponse] = await Promise.all([
              CnHttpFactory.instance({
                path: "role",
                data: {
                  select: { column: ["id", "name"] },
                  modifier: { order: { name: false }, limit: 1000 },
                  granting: true, // only return roles which we can grant access to
                },
              }).query(),

              CnHttpFactory.instance({
                path: "site",
                data: {
                  select: { column: ["id", "name"] },
                  modifier: { order: { name: false }, limit: 1000 },
                  granting: true, // only return sites which we can grant access to
                },
              }).query(),
            ]);

            this.metadata.columnList.role_id.enumList = [];
            roleResponse.data.forEach((item) =>
              self.metadata.columnList.role_id.enumList.push({
                value: item.id,
                name: item.name,
              })
            );

            this.metadata.columnList.site_id.enumList = [];
            siteResponse.data.forEach((item) =>
              self.metadata.columnList.site_id.enumList.push({
                value: item.id,
                name: item.name,
              })
            );
          };

          // extend getTypeaheadData
          this.getTypeaheadData = function (input, viewValue) {
            var data = this.$$getTypeaheadData(input, viewValue);

            // only include active users
            if ("user" == input.typeahead.table) {
              data.modifier.where.unshift({ bracket: true, open: true });
              data.modifier.where.push({ bracket: true, open: false });
              data.modifier.where.push({
                column: "user.active",
                operator: "=",
                value: true,
              });
            }

            return data;
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
