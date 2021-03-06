cenozoApp.defineModule({
  name: "consent",
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
        singular: "consent",
        plural: "consents",
        possessive: "consent's",
        friendlyColumn: "datetime",
      },
      columnList: {
        consent_type: {
          column: "consent_type.name",
          title: "Consent Type",
        },
        accept: {
          title: "Accept",
          type: "boolean",
        },
        written: {
          title: "Written",
          type: "boolean",
        },
        datetime: {
          title: "Date & Time",
          type: "datetime",
        },
      },
      defaultOrder: {
        column: "datetime",
        reverse: true,
      },
    });

    module.addInputGroup("", {
      consent_type_id: {
        title: "Consent Type",
        type: "enum",
        isConstant: "view",
      },
      accept: {
        title: "Accept",
        type: "boolean",
        isConstant: "view",
      },
      written: {
        title: "Written",
        type: "boolean",
        isConstant: "view",
        isExcluded: function ($state, model) {
          return !model.isRole("administrator");
        },
      },
      datetime: {
        title: "Date & Time",
        type: "datetimesecond",
        max: "now",
      },
      note: {
        title: "Note",
        type: "text",
      },
    });

    /* ############################################################################################## */
    cenozo.providers.factory("CnConsentModelFactory", [
      "CnBaseModelFactory",
      "CnConsentListFactory",
      "CnConsentAddFactory",
      "CnConsentViewFactory",
      "CnHttpFactory",
      "CnSession",
      function (
        CnBaseModelFactory,
        CnConsentListFactory,
        CnConsentAddFactory,
        CnConsentViewFactory,
        CnHttpFactory,
        CnSession
      ) {
        var object = function (root) {
          CnBaseModelFactory.construct(this, module);
          this.addModel = CnConsentAddFactory.instance(this);
          this.listModel = CnConsentListFactory.instance(this);
          this.viewModel = CnConsentViewFactory.instance(this, root);

          // extend getBreadcrumbTitle
          // (metadata's promise will have already returned so we don't have to wait for it)
          this.getBreadcrumbTitle = function () {
            var consentType =
              this.metadata.columnList.consent_type_id.enumList.findByProperty(
                "value",
                this.viewModel.record.consent_type_id
              );
            return consentType ? consentType.name : "unknown";
          };

          // extend getMetadata
          this.getMetadata = async function () {
            await this.$$getMetadata();

            var response = await CnHttpFactory.instance({
              path: "consent_type",
              data: {
                select: { column: ["id", "name", "access"] },
                modifier: { order: "name", limit: 1000 },
              },
            }).query();

            this.metadata.columnList.consent_type_id.enumList =
              response.data.reduce((list, item) => {
                list.push({
                  value: item.id,
                  name: item.name,
                  disabled: !item.access,
                });
                return list;
              }, []);
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
