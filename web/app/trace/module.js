cenozoApp.defineModule({
  name: "trace",
  models: ["add", "list"],
  create: (module) => {
    angular.extend(module, {
      identifier: {
        parent: {
          subject: "participant",
          column: "participant.uid",
        },
      },
      name: {
        singular: "trace",
        plural: "traces",
        possessive: "trace'",
      },
      columnList: {
        uid: {
          column: "participant.uid",
          title: "UID",
        },
        cohort: {
          column: "cohort.name",
          title: "Cohort",
          isIncluded: function ($state, model) {
            return "trace.list" == $state.current.name;
          },
        },
        trace_type: {
          column: "trace_type.name",
          title: "Trace Type",
        },
        datetime: {
          title: "Date & Time",
          type: "datetime",
        },
        user: {
          column: "user.name",
          title: "User",
        },
        note: {
          title: "Note",
        },
      },
      defaultOrder: {
        column: "datetime",
        reverse: true,
      },
    });

    module.addInputGroup("", {
      trace_type_id: {
        title: "Trace Type",
        type: "enum",
      },
      note: {
        title: "Note",
        type: "text",
      },
    });

    /* ############################################################################################## */
    cenozo.providers.factory("CnTraceAddFactory", [
      "CnBaseAddFactory",
      function (CnBaseAddFactory) {
        var object = function (parentModel) {
          CnBaseAddFactory.construct(this, parentModel);

          // extend onNew
          this.onNew = async function (record) {
            await this.$$onNew(record);
            await this.parentModel.updateTraceTypeList();
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
    cenozo.providers.factory("CnTraceModelFactory", [
      "CnBaseModelFactory",
      "CnTraceAddFactory",
      "CnTraceListFactory",
      "CnSession",
      "CnHttpFactory",
      "CnModalInputFactory",
      "$state",
      function (
        CnBaseModelFactory,
        CnTraceAddFactory,
        CnTraceListFactory,
        CnSession,
        CnHttpFactory,
        CnModalInputFactory,
        $state
      ) {
        var object = function (root) {
          CnBaseModelFactory.construct(this, module);
          this.addModel = CnTraceAddFactory.instance(this);
          this.listModel = CnTraceListFactory.instance(this);

          // extend getMetadata
          this.getMetadata = async function () {
            await this.$$getMetadata();

            // make the trace type and note mandatory (since users cannot manually set trace type to empty)
            this.metadata.columnList.trace_type_id.required = true;
            this.metadata.columnList.note.required = true;

            var response = await CnHttpFactory.instance({
              path: "trace_type",
              data: {
                select: { column: ["id", "name"] },
                modifier: { order: "name", limit: 1000 },
              },
            }).query();

            this.metadata.columnList.trace_type_id.enumList =
              response.data.reduce((list, item) => {
                // only allow all-site roles to use the "unreachable" trace type
                if ("unreachable" != item.name || CnSession.role.allSites)
                  list.push({
                    value: item.id,
                    name: item.name,
                    disabled: false,
                  });
                return list;
              }, []);
          };

          // When in the trace.list state only show enrolled participants whose last trace_type is not empty
          this.getServiceData = function (type, columnRestrictLists) {
            var data = this.$$getServiceData(type, columnRestrictLists);
            if (
              "trace" == this.getSubjectFromState() &&
              "list" == this.getActionFromState()
            ) {
              if (angular.isUndefined(data.modifier.where))
                data.modifier.where = [];

              // restrict based on role's allSites parameter
              var all = CnSession.role.allSites;
              data.modifier.where.push({
                column: "trace_type.name",
                operator: all ? "!=" : "=",
                value: all ? null : "site",
              });

              // restrict so that excluded participants are not included
              data.modifier.where.push({
                column: "participant.exclusion_id",
                operator: "=",
                value: null,
              });

              // restrict so that participants in a final hold are not included
              // note: we need to select the hold type in order for the service to join to the last hold type
              data.select.column.push({
                table: "hold_type",
                column: "type",
              });
              data.modifier.where.push({
                column: 'IFNULL( hold_type.type, "" )',
                operator: "!=",
                value: "final",
              });
            }
            return data;
          };

          // Only allow viewing a trace when in the trace.list state (which will go to the participant)
          this.getViewEnabled = function () {
            return (
              this.$$getViewEnabled() &&
              "trace" == this.getSubjectFromState() &&
              "list" == this.getActionFromState()
            );
          };

          // Only allow viewing a trace when in the trace.list state (which will go to the participant)
          this.getAddEnabled = function () {
            return (
              this.$$getAddEnabled() &&
              1 < CnSession.role.tier &&
              !(
                "trace" == this.getSubjectFromState() &&
                "list" == this.getActionFromState()
              )
            );
          };

          // When in the trace.list state transition to the participant when clicking the trace record
          this.transitionToViewState = async function (record) {
            await $state.go("participant.view", {
              identifier: "uid=" + record.uid,
            });
          };

          // special function to update the trace-type list based on the participant's current trace
          this.updateTraceTypeList = async function () {
            var parent = this.getParentIdentifier();
            var response = await CnHttpFactory.instance({
              path: [parent.subject, parent.identifier, "trace"].join("/"),
              data: {
                select: { column: ["trace_type_id"] },
                modifier: { order: { "trace.datetime": true } },
              },
            }).query();

            if (0 < response.data.length) {
              // disable the last trace's type
              this.metadata.columnList.trace_type_id.enumList.forEach(
                (traceType) => {
                  traceType.disabled =
                    traceType.value == response.data[0].trace_type_id;
                }
              );
            }
          };

          // Pops up an input dialog to get the reason why a participant will be added to or removed from tracing
          // as a result of adding/activating or removing/deactivating either an address or phone number.
          // Note that this function should be called before making the change to the address or phone.
          //
          // @var identifier is an object with identifer (id) and subject (participant or alternate) properties
          this.checkForTrace = async function (identifier, removed, type) {
            if (angular.isUndefined(removed)) removed = false;
            if ("address" != type && "phone" != type) {
              throw new Error(
                'Tried to check for last contact type "' +
                  type +
                  '".  Must be either "address" or "phone".'
              );
            }

            var traceResponse = true;

            // activate tracing if the contact belongs to a participant who only has one valid contact of the
            // requested type (address or phone) and the last trace is null
            if (
              null != identifier.identifier &&
              "participant" == identifier.subject
            ) {
              var changing_count_column = "active_" + type + "_count";
              var other_count_column =
                "active_" +
                ("address" == type ? "phone" : "address") +
                "_count";
              var response = await CnHttpFactory.instance({
                path: identifier.subject + "/" + identifier.identifier,
                data: {
                  select: {
                    column: [
                      "active_address_count",
                      "active_phone_count",
                      {
                        table: "trace_type",
                        column: "name",
                        alias: "trace_type",
                      },
                    ],
                  },
                },
              }).count();

              if (removed) {
                // check to see if tracing will be required after removing/deactivating the contact type
                if (
                  1 == response.data[changing_count_column] &&
                  null == response.data.trace_type
                ) {
                  traceResponse = await CnModalInputFactory.instance({
                    title: "Tracing Required",
                    message:
                      "If you proceed the participant will no longer have an active " +
                      type +
                      ". " +
                      "In order to help with re-tracing contact with this participant please provide the reason " +
                      "that you are making this change:",
                    required: true,
                    format: "string",
                  }).show();
                }
              } else {
                // check to see if tracing will be resolved after adding/activating the contact type
                if (
                  0 == response.data[changing_count_column] &&
                  0 < response.data[other_count_column] &&
                  null != response.data.trace_type
                ) {
                  traceResponse = await CnModalInputFactory.instance({
                    title: "Tracing Completed",
                    message:
                      "Previously to your change the participant did not have an active " +
                      type +
                      ". " +
                      "Please provide how the new " +
                      type +
                      " information was determined:",
                    required: true,
                    format: "string",
                  }).show();
                }
              }
            }

            return traceResponse;
          };

          // convenience functions
          this.checkForTraceRequiredAfterAddressRemoved = (id) =>
            this.checkForTrace(id, true, "address");
          this.checkForTraceResolvedAfterAddressAdded = (id) =>
            this.checkForTrace(id, false, "address");
          this.checkForTraceRequiredAfterPhoneRemoved = (id) =>
            this.checkForTrace(id, true, "phone");
          this.checkForTraceResolvedAfterPhoneAdded = (id) =>
            this.checkForTrace(id, false, "phone");

          // used to update the last trace record with the provided reason (for participants only)
          // @var identifier is an object with identifer (id) and subject (participant or alternate) properties
          this.setTraceReason = async function (identifier, reason) {
            if (
              null != identifier.identifier &&
              "participant" == identifier.subject
            ) {
              await CnHttpFactory.instance({
                path: identifier.subject + "/" + identifier.identifier,
                data: {
                  explain_last_trace: {
                    user_id: CnSession.user.id,
                    site_id: CnSession.site.id,
                    role_id: CnSession.role.id,
                    application_id: CnSession.application.id,
                    note: reason,
                  },
                },
              }).patch();
            }
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
