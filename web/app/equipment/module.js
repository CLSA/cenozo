cenozoApp.defineModule({
  name: "equipment",
  models: ["add", "list", "view"],
  create: (module) => {
    angular.extend(module, {
      identifier: {
        parent: {
          subject: "equipment_type",
          column: "equipment_type.name",
        },
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
      equipment_type: {
        column: "equipment_type.name",
        title: "Equipment Type",
        type: "string",
        isConstant: true,
        isExcluded: "add",
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
    cenozo.providers.factory("CnEquipmentViewFactory", [
      "CnBaseViewFactory",
      function (CnBaseViewFactory) {
        var object = function (parentModel, root) {
          CnBaseViewFactory.construct(this, parentModel, root);
          this.onView = async function (force) {
            await this.$$onView(force);
            this.heading = this.record.equipment_type.ucWords() + " Details";
          };
        };
        return {
          instance: function (parentModel, root) {
            return new object(parentModel, root);
          },
        };
      },
    ]);

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
            const response = await CnHttpFactory.instance({
              path: "equipment_type/" + parentModel.getParentIdentifier().identifier,
              data: { select: { column: "name" } }
            }).get();

            this.heading = "Create " + response.data.name;
          };
        };
        return {
          instance: function (parentModel) {
            return new object(parentModel);
          },
        };
      },
    ]);
  },
});