cenozoApp.defineModule({
  name: "proxy",
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
        singular: "proxy",
        plural: "proxies",
        possessive: "proxy's",
      },
      columnList: {
        proxy_type: {
          column: "proxy_type.name",
          title: "Proxy Type",
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
      proxy_type_id: {
        title: "Proxy Type",
        type: "enum",
        help: "If empty then the previous proxy is cancelled.",
      },
      datetime: {
        title: "Date & Time",
        type: "datetimesecond",
        max: "now",
        isExcluded: "add",
      },
      user: {
        column: "user.name",
        title: "User",
        type: "string",
        isExcluded: "add",
      },
      site: {
        column: "site.name",
        title: "Site",
        type: "string",
        isExcluded: "add",
      },
      role: {
        column: "role.name",
        title: "Role",
        type: "string",
        isExcluded: "add",
      },
      application: {
        column: "application.name",
        title: "Application",
        type: "string",
        isExcluded: "add",
      },
      note: {
        title: "Note",
        type: "text",
      },
    });

    /* ############################################################################################## */
    cenozo.providers.factory("CnProxyAddFactory", [
      "CnBaseAddFactory",
      "CnModalConfirmFactory",
      function (CnBaseAddFactory, CnModalConfirmFactory) {
        var object = function (parentModel) {
          CnBaseAddFactory.construct(this, parentModel);

          // show the prompt before adding, if there is one
          this.onAdd = async function (record) {
            if (angular.isDefined(record.proxy_type_id)) {
              var prompt =
                this.parentModel.metadata.columnList.proxy_type_id.enumList.findByProperty(
                  "value",
                  record.proxy_type_id
                ).prompt;

              if (
                null != prompt &&
                !(await CnModalConfirmFactory.instance({
                  message: prompt,
                }).show())
              )
                throw "Cancelled by user";
            }

            await this.$$onAdd(record);
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
    cenozo.providers.factory("CnProxyModelFactory", [
      "CnBaseModelFactory",
      "CnProxyListFactory",
      "CnProxyAddFactory",
      "CnProxyViewFactory",
      "CnHttpFactory",
      function (
        CnBaseModelFactory,
        CnProxyListFactory,
        CnProxyAddFactory,
        CnProxyViewFactory,
        CnHttpFactory
      ) {
        var object = function (root) {
          CnBaseModelFactory.construct(this, module);
          this.addModel = CnProxyAddFactory.instance(this);
          this.listModel = CnProxyListFactory.instance(this);
          this.viewModel = CnProxyViewFactory.instance(this, root);

          // extend getBreadcrumbTitle
          // (metadata's promise will have already returned so we don't have to wait for it)
          this.getBreadcrumbTitle = function () {
            var proxyType =
              this.metadata.columnList.proxy_type_id.enumList.findByProperty(
                "value",
                this.viewModel.record.proxy_type_id
              );
            return proxyType ? proxyType.name : "removed";
          };

          // extend getMetadata
          this.getMetadata = async function () {
            await this.$$getMetadata();

            var response = await CnHttpFactory.instance({
              path: "proxy_type",
              data: {
                select: { column: ["id", "name", "prompt", "access"] },
                modifier: { order: "name", limit: 1000 },
              },
            }).query();

            this.metadata.columnList.proxy_type_id.enumList =
              response.data.reduce(function (list, item) {
                list.push({
                  value: item.id,
                  name: item.name,
                  prompt: item.prompt,
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
