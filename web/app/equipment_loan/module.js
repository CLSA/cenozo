cenozoApp.defineModule({
  name: "equipment_loan",
  models: ["add", "list", "view"],
  create: (module) => {
    angular.extend(module, {
      identifier: {
        parent: [{
          subject: "participant",
          column: "participant.uid",
        }, {
          subject: "equipment",
          column: "equipment.serial_number",
        }],
      },
      name: {
        singular: "equipment loan",
        plural: "equipment loans",
        possessive: "equipment loan's",
      },
      columnList: {
        uid: {
          column: "participant.uid",
          title: "Participant",
        },
        equipment_type: {
          column: "equipment_type.name",
          title: "Equipment Type",
        },
        serial_number: {
          column: "equipment.serial_number",
          title: "Serial Number",
        },
        start_datetime: {
          title: "Loan Date & Time",
          type: "datetime",
        },
        end_datetime: {
          title: "Return Date & Time",
          type: "datetime",
        },
      },
      defaultOrder: {
        column: "start_datetime",
        reverse: true,
      },
    });

    module.addInputGroup("", {
      participant_id: {
        title: "Participant",
        type: "lookup-typeahead",
        typeahead: {
          table: "participant",
          select:
            'CONCAT( participant.first_name, " ", participant.last_name, " (", uid, ")" )',
          where: ["participant.first_name", "participant.last_name", "uid"],
        },
        isConstant: "view",
      },
      equipment_type: {
        column: "equipment_type.name",
        title: "Equipment Type",
        type: "string",
        isExcluded: "add",
      },
      serial_number: {
        column: "equipment.serial_number",
        title: "Serial Number",
        type: "string",
        isExcluded: "add",
      },
      start_datetime: {
        title: "Loan Date & Time",
        type: "datetime",
        max: "now",
      },
      end_datetime: {
        title: "Return Date & Time",
        type: "datetime",
        max: "now",
        isExcluded: "add",
      },
      note: {
        title: "Note",
        type: "text",
      },
    });

    /* ############################################################################################## */
    /*
    cenozo.providers.factory("CnEquipmentLoanViewFactory", [
      "CnBaseViewFactory",
      function (CnBaseViewFactory) {
        var object = function (parentModel, root) {
          CnBaseViewFactory.construct(this, parentModel, root);
          this.onView = async function (force) {
            await this.$$onView(force);
            this.heading = this.record.equipment_loan_type.ucWords() + " Details";
          };
        };
        return {
          instance: function (parentModel, root) {
            return new object(parentModel, root);
          },
        };
      },
    ]);
    */

    /* ############################################################################################## */
    /*
    cenozo.providers.factory("CnEquipmentLoanAddFactory", [
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
              path: "equipment_loan_type/" + parentModel.getParentIdentifier().identifier,
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
    */
  },
});
