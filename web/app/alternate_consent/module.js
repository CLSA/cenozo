cenozoApp.defineModule({
  name: "alternate_consent",
  models: ["add", "list", "view"],
  create: (module) => {
    angular.extend(module, {
      identifier: {
        parent: {
          subject: "alternate",
          column: "alternate.id",
        },
      },
      name: {
        singular: "consent",
        plural: "consents",
        possessive: "consent's",
        friendlyColumn: "datetime",
      },
      columnList: {
        alternate_consent_type: {
          column: "alternate_consent_type.name",
          title: "Alternate Consent Type",
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
      alternate_consent_type_id: {
        title: "Alternate Consent Type",
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
    cenozo.providers.factory("CnAlternateConsentModelFactory", [
      "CnBaseModelFactory",
      "CnAlternateConsentListFactory",
      "CnAlternateConsentAddFactory",
      "CnAlternateConsentViewFactory",
      "CnHttpFactory",
      "CnSession",
      function (
        CnBaseModelFactory,
        CnAlternateConsentListFactory,
        CnAlternateConsentAddFactory,
        CnAlternateConsentViewFactory,
        CnHttpFactory,
        CnSession
      ) {
        var object = function (root) {
          CnBaseModelFactory.construct(this, module);
          this.addModel = CnAlternateConsentAddFactory.instance(this);
          this.listModel = CnAlternateConsentListFactory.instance(this);
          this.viewModel = CnAlternateConsentViewFactory.instance(this, root);

          // extend getBreadcrumbTitle
          // (metadata's promise will have already returned so we don't have to wait for it)
          this.getBreadcrumbTitle = function () {
            var consentType =
              this.metadata.columnList.alternate_consent_type_id.enumList.findByProperty(
                "value",
                this.viewModel.record.alternate_consent_type_id
              );
            return consentType ? consentType.name : "unknown";
          };

          // extend getMetadata
          this.getMetadata = async function () {
            await this.$$getMetadata();

            var response = await CnHttpFactory.instance({
              path: "alternate_consent_type",
              data: {
                select: { column: ["id", "name", "access"] },
                modifier: { order: "name", limit: 1000 },
              },
            }).query();

            this.metadata.columnList.alternate_consent_type_id.enumList = [];
            var self = this;
            response.data.forEach((item) => {
              self.metadata.columnList.alternate_consent_type_id.enumList.push({
                value: item.id,
                name: item.name,
                disabled: !item.access,
              });
            });
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
