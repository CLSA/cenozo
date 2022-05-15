cenozoApp.defineModule({
  name: "recording_file",
  models: ["add", "list", "view"],
  create: (module) => {
    angular.extend(module, {
      identifier: {
        parent: {
          subject: "recording",
          column: "recording.rank",
        },
      },
      name: {
        singular: "recording file",
        plural: "recording files",
        possessive: "recording file'",
      },
      columnList: {
        language: {
          column: "language.name",
          title: "Language",
        },
        filename: {
          title: "Filename",
        },
      },
      defaultOrder: {
        column: "language.name",
        reverse: false,
      },
    });

    module.addInputGroup("", {
      language_id: {
        title: "Language",
        type: "enum",
      },
      filename: {
        title: "Filename",
        type: "string",
        help: "The name of the file on the asterisk server.",
      },
    });

    /* ############################################################################################## */
    cenozo.providers.factory("CnRecordingFileModelFactory", [
      "CnBaseModelFactory",
      "CnRecordingFileListFactory",
      "CnRecordingFileAddFactory",
      "CnRecordingFileViewFactory",
      "CnHttpFactory",
      function (
        CnBaseModelFactory,
        CnRecordingFileListFactory,
        CnRecordingFileAddFactory,
        CnRecordingFileViewFactory,
        CnHttpFactory
      ) {
        var object = function (root) {
          CnBaseModelFactory.construct(this, module);
          this.addModel = CnRecordingFileAddFactory.instance(this);
          this.listModel = CnRecordingFileListFactory.instance(this);
          this.viewModel = CnRecordingFileViewFactory.instance(this, root);

          // extend getMetadata
          this.getMetadata = async function () {
            await this.$$getMetadata();

            var response = await CnHttpFactory.instance({
              path: "language",
              data: {
                select: { column: ["id", "name"] },
                modifier: {
                  where: { column: "active", operator: "=", value: true },
                  order: "name",
                  limit: 1000,
                },
              },
            }).query();

            this.metadata.columnList.language_id.enumList =
              response.data.reduce((list, item) => {
                list.push({ value: item.id, name: item.name });
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
