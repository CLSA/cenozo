cenozoApp.defineModule({
  name: "equipment_loan",
  dependencies: "participant",
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
        lost: {
          title: "Lost",
          type: "boolean",
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
      equipment_id: {
        title: "Serial Number",
        type: "lookup-typeahead",
        typeahead: {
          table: "equipment",
          select: 'CONCAT( equipment_type.name, ": ", equipment.serial_number )',
          where: "equipment.serial_number",
        },
        help: "Type in the serial number of the device (do not include the device type",
      },
      lost: {
        title: "Lost",
        type: "boolean",
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
    cenozo.providers.factory("CnEquipmentLoanViewFactory", [
      "CnBaseViewFactory",
      function (CnBaseViewFactory) {
        var object = function (parentModel, root) {
          CnBaseViewFactory.construct(this, parentModel, root);

          // extend the onPatch function
          this.onPatch = async function (data) {
            await this.$$onPatch(data);

            // anytime lost is set to true the backend automatically sets the end datetime to now (if not set)
            if (angular.isDefined(data.lost) && data.lost && null == this.record.end_datetime) {
              this.record.end_datetime = moment().format();
              this.updateFormattedRecord("end_datetime");
            }
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
    cenozo.providers.factory("CnEquipmentLoanModelFactory", [
      "CnBaseModelFactory",
      "CnEquipmentLoanAddFactory",
      "CnEquipmentLoanListFactory",
      "CnEquipmentLoanViewFactory",
      function (
        CnBaseModelFactory,
        CnEquipmentLoanAddFactory,
        CnEquipmentLoanListFactory,
        CnEquipmentLoanViewFactory
      ) {
        var object = function (root) {
          CnBaseModelFactory.construct(this, module);
          angular.extend(this, {
            addModel: CnEquipmentLoanAddFactory.instance(this),
            listModel: CnEquipmentLoanListFactory.instance(this),
            viewModel: CnEquipmentLoanViewFactory.instance(this, root),

            getAddEnabled: function() {
              // Need to override parent method since we don't care if the role doesn't have edit access
              // on the parent model
              return angular.isDefined(this.module.actions.add);
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
