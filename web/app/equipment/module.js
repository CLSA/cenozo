cenozoApp.defineModule({
  name: "equipment",
  models: ["add", "list", "view"],
  create: (module) => {
    angular.extend(module, {
      identifier: {
        parent: [{
          subject: "equipment_type",
          column: "equipment_type.name",
        }, {
          subject: "site",
          column: "site.name",
        }],
      },
      name: {
        singular: "equipment",
        plural: "equipment",
        possessive: "equipment's",
      },
      columnList: {
        equipment_type: {
          column: "equipment_type.name",
          title: "Equipment Type",
        },
        site: {
          column: "site.name",
          title: "Site",
        },
        serial_number: {
          title: "Serial Number",
        },
        uid: {
          column: "participant.uid",
          title: "On Loan",
        },
        note: {
          title: "Note",
          type: "text",
        },
      },
      defaultOrder: {
        column: "serial_number",
        reverse: false,
      },
    });

    module.addInputGroup("", {
      equipment_type_id: {
        title: "Equipment Type",
        type: "enum",
        isConstant: "view",
        isExcluded: function ($state, model) { return "equipment_type" == model.getSubjectFromState(); },
      },
      site_id: {
        title: "Site",
        type: "enum",
        isExcluded: function ($state, model) { return !model.showSite(); },
      },
      serial_number: {
        title: "Serial Number",
        type: "string",
      },
      uid: {
        column: "participant.uid",
        title: "On Loan To",
        type: "string",
        isConstant: true,
        isExcluded: "add",
      },
      note: {
        title: "Note",
        type: "text",
      },
    });

    /* ############################################################################################## */
    cenozo.providers.factory("CnEquipmentAddFactory", [
      "CnBaseAddFactory",
      "CnHttpFactory",
      function (
        CnBaseAddFactory,
        CnHttpFactory
      ) {
        var object = function (parentModel) {
          CnBaseAddFactory.construct(this, parentModel);
          this.onNew = async function (record) {
            this.heading = "Create " + parentModel.module.name.singular.ucWords();
            await this.$$onNew(record);
            const parentIdentifier = parentModel.getParentIdentifier();
            if( "equipment_type" == parentIdentifier.subject ) {
              const response = await CnHttpFactory.instance({
                path: "equipment_type/" + parentModel.getParentIdentifier().identifier,
                data: { select: { column: "name" } }
              }).get();

              this.heading = "Create " + response.data.name;
            } else if( "site" == parentIdentifier.subject ) {
              const response = await CnHttpFactory.instance({
                path: "site/" + parentModel.getParentIdentifier().identifier,
                data: { select: { column: "name" } }
              }).get();

              this.heading = "Create Equipment for " + response.data.name;
            } else {
              this.heading = "Create Equipment";
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
    cenozo.providers.factory("CnEquipmentModelFactory", [
      "CnBaseModelFactory",
      "CnEquipmentAddFactory",
      "CnEquipmentListFactory",
      "CnEquipmentViewFactory",
      "CnSession",
      "CnHttpFactory",
      function (
        CnBaseModelFactory,
        CnEquipmentAddFactory,
        CnEquipmentListFactory,
        CnEquipmentViewFactory,
        CnSession,
        CnHttpFactory
      ) {
        var object = function (root) {
          CnBaseModelFactory.construct(this, module);
          angular.extend(this, {
            addModel: CnEquipmentAddFactory.instance(this),
            listModel: CnEquipmentListFactory.instance(this),
            viewModel: CnEquipmentViewFactory.instance(this, root),

            showSite: function() {
              return CnSession.role.allSites && "site" != this.getSubjectFromState();
            },

            getAddEnabled: function() {
              // Need to override parent method since we don't care if the role doesn't have edit access
              // on the parent model
              return angular.isDefined(this.module.actions.add);
            },

            // extend getMetadata
            getMetadata: async function () {
              await this.$$getMetadata();

              const [equipmentTypeResponse, siteResponse] = await Promise.all([
                await CnHttpFactory.instance({
                  path: "equipment_type",
                  data: {
                    select: { column: ["id", "name"] },
                    modifier: { order: "name", limit: 1000 },
                  },
                }).query(),

                await CnHttpFactory.instance({
                  path: "site",
                  data: {
                    select: { column: ["id", "name"] },
                    modifier: { order: "name", limit: 1000 },
                  },
                }).query(),
              ]);

              this.metadata.columnList.equipment_type_id.enumList = [];
              equipmentTypeResponse.data.forEach((item) => {
                this.metadata.columnList.equipment_type_id.enumList.push({
                  value: item.id,
                  name: item.name,
                });
              });

              this.metadata.columnList.site_id.enumList = [];
              siteResponse.data.forEach((item) => {
                this.metadata.columnList.site_id.enumList.push({
                  value: item.id,
                  name: item.name,
                });
              });
            },
          });
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
