cenozoApp.defineModule({
  name: "script",
  models: ["add", "list", "view"],
  create: (module) => {
    angular.extend(module, {
      identifier: { column: "name" },
      name: {
        singular: "script",
        plural: "scripts",
        possessive: "script's",
      },
      columnList: {
        name: {
          column: "script.name",
          title: "Name",
        },
        application: {
          title: "Application",
        },
        supporting: {
          title: "Supporting",
          type: "boolean",
        },
        repeated: {
          title: "Repeated",
          type: "boolean",
        },
        total_pages: {
          title: "Pages",
        },
        access: {
          title: "In Application",
          type: "boolean",
        },
      },
      defaultOrder: {
        column: "name",
        reverse: false,
      },
    });

    module.addInputGroup("", {
      name: {
        title: "Name",
        type: "string",
      },
      pine_qnaire_id: {
        title: "Pine Questionnaire",
        type: "enum",
      },
      supporting: {
        title: "Supporting",
        type: "boolean",
        help: 'Identifies this as a supporting script (launched in the "Scripts" dropdown when viewing a participant)',
      },
      repeated: {
        title: "Repeated",
        type: "boolean",
      },
      total_pages: {
        title: "Total Number of Pages",
        type: "string",
        isConstant: true,
        isExcluded: "add",
        help: "Updated nightly from Pine.",
      },
      create_event_types: {
        title: "Create Start/Finish Event Types",
        type: "boolean",
        isExcluded: "view",
        help: "Only used when creating a non-repeating script.",
      },
      started_event_type_id: {
        title: "Started Event Type",
        type: "enum",
        isExcluded: "add",
      },
      finished_event_type_id: {
        title: "Finished Event Type",
        type: "enum",
        isExcluded: "add",
      },
      description: {
        title: "Description",
        type: "text",
      },
    });

    /* ############################################################################################## */
    cenozo.providers.factory("CnScriptAddFactory", [
      "CnBaseAddFactory",
      function (CnBaseAddFactory) {
        var object = function (parentModel) {
          CnBaseAddFactory.construct(this, parentModel);

          this.onAdd = async function (record) {
            // define the number of pages if this is a pine script
            if (angular.isDefined(record.pine_qnaire_id)) {
              var enumList =
                this.parentModel.metadata.columnList.pine_qnaire_id.enumList;
              record.total_pages = enumList.findByProperty(
                "value",
                record.pine_qnaire_id
              ).total_pages;
            }
            this.$$onAdd(record);
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
    cenozo.providers.factory("CnScriptModelFactory", [
      "CnBaseModelFactory",
      "CnScriptAddFactory",
      "CnScriptListFactory",
      "CnScriptViewFactory",
      "CnHttpFactory",
      function (
        CnBaseModelFactory,
        CnScriptAddFactory,
        CnScriptListFactory,
        CnScriptViewFactory,
        CnHttpFactory
      ) {
        var object = function (root) {
          CnBaseModelFactory.construct(this, module);
          this.addModel = CnScriptAddFactory.instance(this);
          this.listModel = CnScriptListFactory.instance(this);
          this.viewModel = CnScriptViewFactory.instance(this, root);

          // extend getMetadata
          this.getMetadata = async function () {
            await this.$$getMetadata();

            var [pineQnaireResponse, eventTypeResponse] = await Promise.all([
              CnHttpFactory.instance({
                path: "pine_qnaire",
                data: {
                  select: { column: ["id", "name", "total_pages"] },
                  modifier: { order: { name: false }, limit: 1000 },
                },
              }).query(),

              CnHttpFactory.instance({
                path: "event_type",
                data: {
                  select: { column: ["id", "name"] },
                  modifier: { order: "name", limit: 1000 },
                },
              }).query(),
            ]);

            this.metadata.columnList.pine_qnaire_id.enumList =
              pineQnaireResponse.data.reduce((list, item) => {
                list.push({
                  value: item.id,
                  name: item.name,
                  total_pages: item.total_pages,
                });
                return list;
              }, []);

            this.metadata.columnList.started_event_type_id.enumList =
              eventTypeResponse.data.reduce((list, item) => {
                list.push({ value: item.id, name: item.name });
                return list;
              }, []);

            this.metadata.columnList.finished_event_type_id.enumList =
              angular.copy(
                this.metadata.columnList.started_event_type_id.enumList
              );
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
