cenozoApp.defineModule({
  name: "event",
  models: ["add", "list", "view"],
  create: (module) => {
    angular.extend(module, {
      identifier: {
        parent: {
          subject: "participant",
          column: "participant.uid",
        },
      },
      name: {
        singular: "event",
        plural: "events",
        possessive: "event's",
      },
      columnList: {
        event_type: {
          column: "event_type.name",
          title: "Event Type",
        },
        datetime: {
          title: "Date & Time",
          type: "datetimesecond",
        },
      },
      defaultOrder: {
        column: "datetime",
        reverse: true,
      },
    });

    module.addInputGroup("", {
      event_type_id: {
        title: "Event Type",
        type: "enum",
      },
      datetime: {
        title: "Date & Time",
        type: "datetimesecond",
        max: "now",
      },
    });

    module.addInputGroup("Site/User", {
      site: {
        column: "site.name",
        title: "Site",
        type: "string",
        isConstant: true,
      },
      user_name: {
        column: "user.name",
        title: "Username",
        type: "string",
        isConstant: true,
      },
      user_first_name: {
        column: "user.first_name",
        title: "First Name",
        type: "string",
        isConstant: true,
      },
      user_last_name: {
        column: "user.last_name",
        title: "Last Name",
        type: "string",
        isConstant: true,
      },
    });

    module.addInputGroup("Address", {
      international: {
        column: "event_address.international",
        title: "International",
        type: "string",
        isConstant: true,
      },
      address1: {
        column: "event_address.address1",
        title: "Address Line 1",
        type: "string",
        isConstant: true,
      },
      address2: {
        column: "event_address.address2",
        title: "Address Line 2",
        type: "string",
        isConstant: true,
      },
      city: {
        column: "event_address.city",
        title: "City",
        type: "string",
        isConstant: true,
      },
      region_id: {
        column: "region.name",
        title: "Region",
        type: "string",
        isConstant: true,
      },
      postcode: {
        column: "event_address.postcode",
        title: "Postcode",
        type: "string",
        isConstant: true,
      },
    });

    /* ############################################################################################## */
    cenozo.providers.factory("CnEventViewFactory", [
      "CnBaseViewFactory",
      function (CnBaseViewFactory) {
        var object = function (parentModel, root) {
          CnBaseViewFactory.construct(this, parentModel, root, 'event_mail');

          // extend onView
          this.onView = async function (force) {
            await this.$$onView(force);

            // Since the international column is read-only and belongs to a different table we can fake
            // the expected Yes/No value by changing it here
            if (null != this.record.international)
              this.record.international = this.record.international
                ? "Yes"
                : "No";
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
    cenozo.providers.factory("CnEventModelFactory", [
      "CnBaseModelFactory",
      "CnEventListFactory",
      "CnEventAddFactory",
      "CnEventViewFactory",
      "CnHttpFactory",
      function (
        CnBaseModelFactory,
        CnEventListFactory,
        CnEventAddFactory,
        CnEventViewFactory,
        CnHttpFactory
      ) {
        var object = function (root) {
          CnBaseModelFactory.construct(this, module);
          this.addModel = CnEventAddFactory.instance(this);
          this.listModel = CnEventListFactory.instance(this);
          this.viewModel = CnEventViewFactory.instance(this, root);

          angular.extend(this, {
            // extend getBreadcrumbTitle
            // (metadata's promise will have already returned so we don't have to wait for it)
            getBreadcrumbTitle: function () {
              var eventType =
                this.metadata.columnList.event_type_id.enumList.findByProperty(
                  "value",
                  this.viewModel.record.event_type_id
                );
              return eventType ? eventType.name : "unknown";
            },

            // extend getMetadata
            getMetadata: async function () {
              await this.$$getMetadata();

              var response = await CnHttpFactory.instance({
                path: "event_type",
                data: {
                  select: { column: ["id", "name", "access"] },
                  modifier: { order: "name", limit: 1000 },
                },
              }).query();

              this.metadata.columnList.event_type_id.enumList =
                response.data.reduce((list, item) => {
                  list.push({
                    value: item.id,
                    name: item.name,
                    disabled: !item.access,
                  });
                  return list;
                }, []);
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
