cenozoApp.defineModule({
  name: "form",
  models: ["list", "view"],
  create: (module) => {
    angular.extend(module, {
      identifier: {
        parent: {
          subject: "participant",
          column: "participant.uid",
        },
      },
      name: {
        singular: "form",
        plural: "forms",
        possessive: "form's",
      },
      columnList: {
        form_type: {
          column: "form_type.title",
          title: "Form Type",
        },
        uid: {
          column: "participant.uid",
          title: "UID",
        },
        date: {
          title: "Date & Time",
          type: "date",
        },
      },
      defaultOrder: {
        column: "date",
        reverse: true,
      },
    });

    module.addInputGroup("", {
      form_type_id: {
        title: "Form Type",
        type: "enum",
      },
      date: {
        title: "Date & Time",
        type: "date",
        max: "now",
      },
    });

    module.addExtraOperation("view", {
      title: "Download",
      isDisabled: function ($state, model) {
        return angular.isUndefined(model.viewModel.downloadFile);
      },
      operation: function ($state, model) {
        model.viewModel.downloadFile();
      },
    });

    /* ############################################################################################## */
    cenozo.providers.factory("CnFormViewFactory", [
      "CnBaseViewFactory",
      "CnHttpFactory",
      function (CnBaseViewFactory, CnHttpFactory) {
        var object = function (parentModel, root) {
          CnBaseViewFactory.construct(this, parentModel, root);

          var self = this;
          this.afterView(function () {
            if (angular.isUndefined(self.downloadFile)) {
              self.downloadFile = function () {
                return CnHttpFactory.instance({
                  path: "form/" + self.record.getIdentifier(),
                  format: "pdf",
                }).file();
              };
            }
          });
        };
        return {
          instance: function (parentModel, root) {
            return new object(parentModel, root);
          },
        };
      },
    ]);

    /* ############################################################################################## */
    cenozo.providers.factory("CnFormModelFactory", [
      "CnBaseModelFactory",
      "CnFormListFactory",
      "CnFormViewFactory",
      "CnHttpFactory",
      function (
        CnBaseModelFactory,
        CnFormListFactory,
        CnFormViewFactory,
        CnHttpFactory
      ) {
        var object = function (root) {
          CnBaseModelFactory.construct(this, module);
          this.listModel = CnFormListFactory.instance(this);
          this.viewModel = CnFormViewFactory.instance(this, root);

          // extend getBreadcrumbTitle
          // (metadata's promise will have already returned so we don't have to wait for it)
          this.getBreadcrumbTitle = function () {
            var formType =
              this.metadata.columnList.form_type_id.enumList.findByProperty(
                "value",
                this.viewModel.record.form_type_id
              );
            return formType ? formType.name : "unknown";
          };

          // extend getMetadata
          this.getMetadata = async function () {
            await this.$$getMetadata();

            var response = await CnHttpFactory.instance({
              path: "form_type",
              data: {
                select: { column: ["id", "title"] },
                modifier: { order: "title", limit: 1000 },
              },
            }).query();

            this.metadata.columnList.form_type_id.enumList =
              response.data.reduce((list, item) => {
                list.push({ value: item.id, name: item.title });
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
