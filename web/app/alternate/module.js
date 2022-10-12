cenozoApp.defineModule({
  name: "alternate",
  dependencies: ["participant"],
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
        singular: "alternate",
        plural: "alternates",
        possessive: "alternate's",
        friendlyColumn: "association",
      },
      columnList: {
        uid: {
          column: "participant.uid",
          title: "Participant",
        },
        active: {
          title: "Active",
          type: "boolean",
        },
        first_name: {
          column: "alternate.first_name",
          title: "First Name",
        },
        last_name: {
          column: "alternate.last_name",
          title: "Last Name",
        },
        association: {
          title: "Association",
        },
        alternate_type_list: {
          title: "Types",
        },
        global_note: {
          column: "alternate.global_note",
          title: "Special Note",
          type: "text",
          limit: 20,
        },
      },
      defaultOrder: {
        column: "uid",
        reverse: false,
      },
    });

    module.addInputGroup("", {
      participant_id: {
        column: "alternate.participant_id",
        title: "Participant",
        type: "lookup-typeahead",
        typeahead: {
          table: "participant",
          select:
            'CONCAT( participant.first_name, " ", participant.last_name, " (", uid, ")" )',
          where: ["participant.first_name", "participant.last_name", "uid"],
        },
      },
      active: {
        title: "Active",
        type: "boolean",
      },
      first_name: {
        column: "alternate.first_name",
        title: "First Name",
        type: "string",
      },
      last_name: {
        column: "alternate.last_name",
        title: "Last Name",
        type: "string",
      },
      association: {
        title: "Association",
        type: "string",
        help:
          "How the alternate knows the participant (son, neighbour, wife, etc). " +
          "DO NOT include phone numbers.",
        regex: "^[^0-9]*[0-9]?[^0-9]*$",
      },
      language_id: {
        title: "Preferred Language",
        type: "enum",
      },
      email: {
        title: "Email",
        type: "string",
        format: "email",
        help: 'Must be in the format "account@domain.name".',
      },
      email2: {
        title: "Alternate Email",
        type: "string",
        format: "email2",
        help: 'Must be in the format "account@domain.name".',
      },
      alternate_type_id: {
        title: "Specific Role",
        type: "enum",
        help: "You can add more than one role after the alternate has been created.",
        isExcluded: "view",
      },
      global_note: {
        column: "alternate.global_note",
        title: "Special Note",
        type: "text",
      },
    });

    module.addInputGroup("Phone (must be provided)", {
      phone_international: {
        title: "International",
        type: "boolean",
        help: "Cannot be changed once the phone number has been created.",
        isExcluded: "view",
      },
      phone_type: {
        title: "Type",
        type: "enum",
        isExcluded: "view",
      },
      phone_number: {
        title: "Number",
        type: "string",
        help: "Must be in 000-000-0000 format.",
        isExcluded: "view",
      },
      phone_note: {
        title: "Note",
        type: "text",
        isExcluded: "view",
      },
    });

    module.addInputGroup("Address (optional)", {
      address_international: {
        title: "International",
        type: "boolean",
        help: "Cannot be changed once the address has been created.",
        isExcluded: "view",
      },
      address_address1: {
        title: "Address Line 1",
        type: "string",
        isExcluded: "view",
      },
      address_address2: {
        title: "Address Line 2",
        type: "string",
        isExcluded: "view",
      },
      address_city: {
        title: "City",
        type: "string",
        isExcluded: "view",
      },
      address_postcode: {
        title: "Postcode",
        type: "string",
        help: 'Non-international postal codes must be in "A1A 1A1" format, zip codes in "01234" format.',
        isExcluded: "view",
      },
      address_note: {
        title: "Note",
        type: "text",
        isExcluded: "view",
      },
    });

    if (angular.isDefined(module.actions.notes)) {
      module.addExtraOperation("view", {
        title: "Notes",
        operation: async function ($state, model) {
          await model.viewModel.onViewPromise;
          await $state.go("alternate.notes", {
            identifier: model.viewModel.record.getIdentifier(),
          });
        },
      });
    }

    if (angular.isDefined(module.actions.history)) {
      module.addExtraOperation("view", {
        title: "History",
        operation: async function ($state, model) {
          await model.viewModel.onViewPromise;
          await $state.go("alternate.history", {
            identifier: model.viewModel.record.getIdentifier(),
          });
        },
      });
    }

    if (angular.isDefined(module.actions.list)) {
      module.addExtraOperation("view", {
        title: "Alternate List",
        operation: async function ($state) {
          await $state.go("alternate.list");
        },
      });
    }

    /**
     * The historyCategoryList object stores the following information
     *   category:
     *     active: whether or not to show the category in the history list by default
     *     promise: an async function which gets all history items for that category
     *
     * This can be extended by applications by adding new history categories or changing existing ones.
     * Note: make sure the category name (the object's property) matches the property set in the historyList
     */
    module.historyCategoryList = {
      Address: {
        active: true,
        framework: true,
        promise: async function (historyList, $state, CnHttpFactory) {
          var response = await CnHttpFactory.instance({
            path: "alternate/" + $state.params.identifier + "/address",
            data: {
              modifier: {
                join: {
                  table: "region",
                  onleft: "address.region_id",
                  onright: "region.id",
                },
              },
              select: {
                column: [
                  "create_timestamp",
                  "rank",
                  "address1",
                  "address2",
                  "city",
                  "postcode",
                  "international",
                  { table: "region", column: "name", alias: "region" },
                  { table: "country", column: "name", alias: "country" },
                ],
              },
            },
          }).query();

          response.data.forEach((item) => {
            var description = item.address1;
            if (item.address2) description += "\n" + item.address2;
            description +=
              "\n" +
              item.city +
              ", " +
              item.region +
              ", " +
              item.country +
              "\n" +
              item.postcode;
            if (item.international) description += "\n(international)";
            historyList.push({
              datetime: item.create_timestamp,
              category: "Address",
              title: "added rank " + item.rank,
              description: description,
            });
          });
        },
      },

      Note: {
        active: true,
        framework: true,
        promise: async function (historyList, $state, CnHttpFactory) {
          var response = await CnHttpFactory.instance({
            path: "alternate/" + $state.params.identifier + "/note",
            data: {
              modifier: {
                join: {
                  table: "user",
                  onleft: "note.user_id",
                  onright: "user.id",
                },
                order: { datetime: true },
              },
              select: {
                column: [
                  "datetime",
                  "note",
                  { table: "user", column: "first_name", alias: "user_first" },
                  { table: "user", column: "last_name", alias: "user_last" },
                ],
              },
            },
          }).query();

          response.data.forEach((item) => {
            historyList.push({
              datetime: item.datetime,
              category: "Note",
              title: "added by " + item.user_first + " " + item.user_last,
              description: item.note,
            });
          });
        },
      },

      Phone: {
        active: true,
        framework: true,
        promise: async function (historyList, $state, CnHttpFactory) {
          var response = await CnHttpFactory.instance({
            path: "alternate/" + $state.params.identifier + "/phone",
            data: {
              select: {
                column: [
                  "create_timestamp",
                  "rank",
                  "type",
                  "number",
                  "international",
                ],
              },
            },
          }).query();

          response.data.forEach((item) => {
            historyList.push({
              datetime: item.create_timestamp,
              category: "Phone",
              title: "added rank " + item.rank,
              description:
                item.type +
                ": " +
                item.number +
                (item.international ? " (international)" : ""),
            });
          });
        },
      },
    };

    /* ############################################################################################## */
    cenozo.providers.directive("cnAlternateHistory", [
      "CnAlternateHistoryFactory",
      "CnSession",
      "CnHttpFactory",
      "$state",
      function (CnAlternateHistoryFactory, CnSession, CnHttpFactory, $state) {
        return {
          templateUrl: cenozo.getFileUrl("cenozo", "history.tpl.html"),
          restrict: "E",
          controller: async function ($scope) {
            $scope.isLoading = false;
            $scope.model = CnAlternateHistoryFactory.instance();

            var response = await CnHttpFactory.instance({
              path: "alternate/" + $state.params.identifier,
              data: { select: { column: ["id", "first_name", "last_name"] } },
            }).get();

            $scope.name =
              response.data.first_name + " " + response.data.last_name;
            $scope.id = response.data.id;

            // create an array from the history categories object
            $scope.historyCategoryArray = [];
            for (var name in $scope.model.module.historyCategoryList) {
              if (
                angular.isUndefined(
                  $scope.model.module.historyCategoryList[name].framework
                )
              )
                $scope.model.module.historyCategoryList[name].framework = false;
              if (
                angular.isUndefined(
                  $scope.model.module.historyCategoryList[name].name
                )
              )
                $scope.model.module.historyCategoryList[name].name = name;
              $scope.historyCategoryArray.push(
                $scope.model.module.historyCategoryList[name]
              );
            }

            $scope.refresh = async function () {
              $scope.isLoading = true;
              try {
                await $scope.model.onView();
              } finally {
                $scope.isLoading = false;
              }
            };
            $scope.refresh();
          },
        };
      },
    ]);

    /* ############################################################################################## */
    cenozo.providers.directive("cnAlternateNotes", [
      "CnAlternateNotesFactory",
      function (CnAlternateNotesFactory) {
        return {
          templateUrl: cenozo.getFileUrl("cenozo", "notes.tpl.html"),
          restrict: "E",
          controller: async function ($scope) {
            angular.extend($scope, {
              model: CnAlternateNotesFactory.instance(),

              // trigger the elastic directive when adding a note or undoing
              addNote: async function () {
                await $scope.model.addNote();
                angular.element("#newNote").trigger("elastic");
              },

              undo: async function (id) {
                await $scope.model.undo(id);
                angular.element("#note" + id).trigger("elastic");
              },

              refresh: async function () {
                await $scope.model.onView();
              },
            });

            await $scope.model.onView();
          },
        };
      },
    ]);

    /* ############################################################################################## */
    cenozo.providers.factory("CnAlternateViewFactory", [
      "CnBaseViewFactory",
      "CnHttpFactory",
      function (CnBaseViewFactory, CnHttpFactory) {
        var object = function (parentModel, root) {
          CnBaseViewFactory.construct(
            this,
            parentModel,
            root,
            "alternate_type"
          );
          this.onViewPromise = null;

          // track the promise returned by the onView function
          this.onView = async function (force) {
            this.onViewPromise = await this.$$onView(force);

            if (this.alternateTypeModel) {
              this.alternateTypeModel.listModel.isChooseDisabled = function (record) {
                return 0 < record.role_count && !record.access;
              };
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
    cenozo.providers.factory("CnAlternateModelFactory", [
      "CnBaseModelFactory",
      "CnAlternateListFactory",
      "CnAlternateAddFactory",
      "CnAlternateViewFactory",
      "CnSession",
      "CnHttpFactory",
      function (
        CnBaseModelFactory,
        CnAlternateListFactory,
        CnAlternateAddFactory,
        CnAlternateViewFactory,
        CnSession,
        CnHttpFactory
      ) {
        var object = function (root) {
          CnBaseModelFactory.construct(this, module);
          this.addModel = CnAlternateAddFactory.instance(this);
          this.listModel = CnAlternateListFactory.instance(this);
          this.viewModel = CnAlternateViewFactory.instance(this, root);

          // prevent add button from showing when viewing list of alternates under the wrong context
          this.getAddEnabled = function () {
            return (
              ["alternate", "participant"].includes(
                this.getSubjectFromState()
              ) && this.$$getAddEnabled()
            );
          };

          // extend getMetadata
          this.getMetadata = async function () {
            await this.$$getMetadata();

            var [
              altTypeListResponse,
              languageResponse,
              altTypeResponse,
              phoneResponse,
              addressResponse,
            ] = await Promise.all([
              CnHttpFactory.instance({
                path: "alternate_type",
                data: {
                  select: { column: ["id", "title", "role_count", "access"] },
                  modifier: {
                    order: "title",
                    limit: 1000000,
                  },
                },
              }).query(),

              CnHttpFactory.instance({
                path: "language",
                data: {
                  select: { column: ["id", "name"] },
                  modifier: {
                    where: { column: "active", operator: "=", value: true },
                    order: "name",
                    limit: 1000000,
                  },
                },
              }).query(),

              CnHttpFactory.instance({ path: "alternate_type" }).head(),
              CnHttpFactory.instance({ path: "phone" }).head(),
              CnHttpFactory.instance({ path: "address" }).head(),
            ]);

            this.metadata.columnList.language_id.enumList =
              languageResponse.data.reduce((list, item) => {
                list.push({ value: item.id, name: item.name });
                return list;
              }, []);

            var alternateTypeColumn = angular.fromJson(
              altTypeResponse.headers("Columns")
            );
            alternateTypeColumn.required = false;
            alternateTypeColumn.enumList = altTypeListResponse.data.reduce(
              (list, item) => {
                list.push({
                  value: item.id,
                  name: item.title,
                  disabled: 0 < item.role_count && !item.access,
                });
                return list;
              },
              []
            );

            var phoneColumnList = angular.fromJson(
              phoneResponse.headers("Columns")
            );
            phoneColumnList.international.required =
              "1" == phoneColumnList.international.required;
            phoneColumnList.type.required =
              "1" == phoneColumnList.type.required;
            phoneColumnList.number.required =
              "1" == phoneColumnList.number.required;
            phoneColumnList.note.required =
              "1" == phoneColumnList.note.required;
            phoneColumnList.type.enumList = [];
            cenozo.parseEnumList(phoneColumnList.type).forEach((item) => {
              phoneColumnList.type.enumList.push({ value: item, name: item });
            });

            var addressColumnList = angular.fromJson(
              addressResponse.headers("Columns")
            );
            addressColumnList.international.required = false;
            addressColumnList.address1.required = false;
            addressColumnList.address2.required = false;
            addressColumnList.city.required = false;
            addressColumnList.postcode.required = false;
            addressColumnList.note.required = false;
            addressColumnList.international.default = null;

            angular.extend(this.metadata.columnList, {
              alternate_type_id: alternateTypeColumn,
              phone_international: phoneColumnList.international,
              phone_type: phoneColumnList.type,
              phone_number: phoneColumnList.number,
              phone_note: phoneColumnList.note,
              address_international: addressColumnList.international,
              address_address1: addressColumnList.address1,
              address_address2: addressColumnList.address2,
              address_city: addressColumnList.city,
              address_postcode: addressColumnList.postcode,
              address_note: addressColumnList.note,
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

    /* ############################################################################################## */
    cenozo.providers.factory("CnAlternateHistoryFactory", [
      "CnBaseHistoryFactory",
      "CnAlternateModelFactory",
      "CnSession",
      "$state",
      function (
        CnBaseHistoryFactory,
        CnAlternateModelFactory,
        CnSession,
        $state
      ) {
        var object = function () {
          CnBaseHistoryFactory.construct(
            this,
            module,
            CnAlternateModelFactory.root
          );

          async function init(object) {
            await object.onView();

            CnSession.setBreadcrumbTrail([
              {
                title: "Alternates",
                go: async function () {
                  await $state.go("alternate.list");
                },
              },
              {
                title: String($state.params.identifier).split("=").pop(),
                go: async function () {
                  await $state.go("alternate.view", {
                    identifier: $state.params.identifier,
                  });
                },
              },
              {
                title: "History",
              },
            ]);
          }

          init(this);
        };

        return {
          instance: function () {
            return new object(false);
          },
        };
      },
    ]);

    /* ############################################################################################## */
    cenozo.providers.factory("CnAlternateNotesFactory", [
      "CnBaseNoteFactory",
      "CnAlternateModelFactory",
      "CnSession",
      "CnHttpFactory",
      "$state",
      function (CnBaseNoteFactory, CnAlternateModelFactory, CnSession, CnHttpFactory, $state) {
        var object = function () {
          CnBaseNoteFactory.construct(this, module);
          this.parentModel = CnAlternateModelFactory.root;

          async function init(object) {
            await object.onView();

            CnSession.setBreadcrumbTrail([
              {
                title: "Alternates",
                go: async function () {
                  await $state.go("alternate.list");
                },
              },
              {
                title: String($state.params.identifier).split("=").pop(),
                go: async function () {
                  await $state.go("alternate.view", {
                    identifier: $state.params.identifier,
                  });
                },
              },
              {
                title: "Notes",
              },
            ]);
          }

          init(this);
        };

        return {
          instance: function () {
            return new object(false);
          },
        };
      },
    ]);
  },
});
