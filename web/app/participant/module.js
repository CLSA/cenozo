cenozoApp.defineModule({
  name: "participant",
  optionalDependencies: [
    "address",
    "consent",
    "event",
    "hold",
    "phone",
    "proxy",
    "trace",
  ],
  models: ["list", "view"],
  create: (module) => {
    angular.extend(module, {
      identifier: { column: "uid" },
      name: {
        singular: "participant",
        plural: "participants",
        possessive: "participant's",
      },
      columnList: {
        uid: {
          column: "participant.uid",
          title: "UID",
        },
        sid: {
          column: "participant_identifier.value",
          title: "Study ID",
          isIncluded: function ($state, model) {
            return model.hasIdentifier;
          },
          help: "Special study identifier used by this application.",
        },
        first: {
          column: "participant.first_name",
          title: "First",
        },
        last: {
          column: "participant.last_name",
          title: "Last",
        },
        cohort: {
          column: "cohort.name",
          title: "Cohort",
        },
        status: {
          title: "Effective Status",
        },
        site: {
          column: "site.name",
          title: "Site",
        },
        global_note: {
          column: "participant.global_note",
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

    // define inputs
    module.addInputGroup("", {
      uid: {
        title: "Unique ID",
        type: "string",
        isConstant: true,
      },
      sid: {
        column: "participant_identifier.value",
        title: "Study ID",
        type: "string",
        isExcluded: function ($state, model) {
          return !model.hasIdentifier;
        },
        isConstant: true,
        help: "Special study identifier used by this application.",
      },
      cohort: {
        column: "cohort.name",
        title: "Cohort",
        type: "string",
        isConstant: true,
      },
      status: {
        title: "Status",
        type: "string",
        isConstant: true,
      },
      global_note: {
        column: "participant.global_note",
        title: "Special Note",
        type: "text",
      },
    });

    module.addInputGroup("Naming Details", {
      honorific: {
        title: "Honorific",
        type: "string",
        help:
          "English examples: Mr. Mrs. Miss Ms. Dr. Prof. Br. Sr. Fr. Rev. Pr.  " +
          "French examples: M. Mme Dr Dre Prof. F. Sr P. R??v??rend Pasteur Pasteure Me",
      },
      first_name: {
        title: "First Name",
        type: "string",
      },
      other_name: {
        title: "Other/Nickname",
        type: "string",
      },
      last_name: {
        title: "Last Name",
        type: "string",
      },
    });

    module.addInputGroup("Status Details", {
      exclusion: {
        title: "Enrolled",
        type: "string",
        isConstant: true,
        help: "Whether the participant has been enrolled into the study, and if not then the reason they have been excluded.",
      },
      hold: {
        title: "Hold",
        type: "string",
        isConstant: true,
        action: {
          id: "change_hold",
          title: "Change",
          isDisabled: function ($state, model) {
            return !(
              model.viewModel.holdModel &&
              model.viewModel.holdModel.getAddEnabled()
            );
          },
          operation: async function ($state, model) {
            await model.viewModel.onViewPromise;
            await $state.go("participant.add_hold", {
              parentIdentifier: model.viewModel.record.getIdentifier(),
            });
          },
        },
        help: "Whether the participant is currently in a hold.",
      },
      trace: {
        title: "Trace",
        type: "string",
        isConstant: true,
        action: {
          id: "change_trace",
          title: "Change",
          isDisabled: function ($state, model) {
            return !(
              model.viewModel.traceModel &&
              model.viewModel.traceModel.getAddEnabled()
            );
          },
          operation: async function ($state, model) {
            await model.viewModel.onViewPromise;
            await $state.go("participant.add_trace", {
              parentIdentifier: model.viewModel.record.getIdentifier(),
            });
          },
        },
        help: "Whether the participant currently requires tracing.",
      },
      proxy: {
        title: "Proxy",
        type: "string",
        isConstant: true,
        action: {
          id: "change_proxy",
          title: "Change",
          isDisabled: function ($state, model) {
            return !(
              model.viewModel.proxyModel &&
              model.viewModel.proxyModel.getAddEnabled()
            );
          },
          operation: async function ($state, model) {
            await model.viewModel.onViewPromise;
            await $state.go("participant.add_proxy", {
              parentIdentifier: model.viewModel.record.getIdentifier(),
            });
          },
        },
        help: "Whether the participant requires a proxy, and if so then what their proxy status is.",
      },
    });

    module.addInputGroup("Defining Details", {
      source: {
        column: "source.name",
        title: "Source",
        type: "string",
        isConstant: true,
      },
      sex: {
        title: "Sex at Birth",
        type: "enum",
        isConstant: true,
      },
      current_sex: {
        title: "Current Sex",
        type: "enum",
      },
      date_of_birth: {
        title: "Date of Birth",
        type: "dob",
        max: "now",
        isConstant: function ($state, model) {
          return !model.isRole("administrator");
        },
      },
      date_of_death: {
        title: "Date of Death",
        type: "dod",
        min: "date_of_birth",
        max: "now",
      },
      date_of_death_accuracy: {
        title: "Date of Death Accuracy",
        type: "enum",
        help: "Defines how accurate the date of death is.",
        isConstant: function ($state, model) {
          return (
            angular.isUndefined(model.viewModel.record.date_of_death) ||
            null == model.viewModel.record.date_of_death
          );
        },
      },
      date_of_death_ministry: {
        title: "Death Confirmed by Ministry",
        type: "boolean",
        help: "Determines whether information about the participant's death is confirmed by a ministry",
        isConstant: function ($state, model) {
          return (
            angular.isUndefined(model.viewModel.record.date_of_death) ||
            null == model.viewModel.record.date_of_death
          );
        },
      },
      language_id: {
        title: "Preferred Language",
        type: "enum",
      },
    });

    module.addInputGroup("Site & Contact Details", {
      default_site: {
        column: "default_site.name",
        title: "Default Site",
        type: "string",
        isConstant: true,
        help: "The site the participant belongs to if a preferred site is not set.",
      },
      preferred_site_id: {
        column: "preferred_site.id",
        title: "Preferred Site",
        type: "enum",
        help: "If set then the participant will be assigned to this site instead of the default site.",
      },
      callback: {
        title: "Callback",
        type: "datetime",
        min: "now",
      },
      availability_type_id: {
        title: "Availability Preference",
        type: "enum",
      },
      out_of_area: {
        title: "Out of Area",
        type: "boolean",
        help: "Whether the participant lives outside of the study's serviceable area",
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
      mass_email: {
        title: "Mass Emails",
        type: "boolean",
        help:
          "Whether the participant wishes to be included in mass emails such as newsletters, " +
          "holiday greetings, etc.",
      },
    });

    if (angular.isDefined(module.actions.notes)) {
      module.addExtraOperation("view", {
        title: "Notes",
        operation: async function ($state, model) {
          await model.viewModel.onViewPromise;
          await $state.go("participant.notes", {
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
          await $state.go("participant.history", {
            identifier: model.viewModel.record.getIdentifier(),
          });
        },
      });
    }

    module.addExtraOperation("view", {
      title: "Use Timezone",
      help: "Changes to the same timezone as the participant's first active address",
      operation: async function ($state, model) {
        await model.viewModel.onViewPromise;
        await model.viewModel.useTimezone();
      },
    });

    try {
      var tokenModule = cenozoApp.module("token");
      if (tokenModule && angular.isDefined(tokenModule.actions.add)) {
        module.addExtraOperationGroup("view", {
          title: "Scripts",
          operations: [
            {
              title: "Decedent",
              operation: function ($state, model) {
                model.viewModel.launchSupportingScript("Decedent");
              },
              isDisabled: function ($state, model) {
                return !model.getEditEnabled();
              },
              isIncluded: function ($state, model) {
                return (
                  model.viewModel.allowDecedent &&
                  false === model.viewModel.hasDecedent
                );
              },
            },
            {
              title: "Decedent Complete",
              isDisabled: function ($state, model) {
                return !model.getEditEnabled();
              },
              isIncluded: function ($state, model) {
                return (
                  model.viewModel.allowDecedent &&
                  true === model.viewModel.hasDecedent
                );
              },
            },
            {
              title: "Quality Control",
              operation: function ($state, model) {
                model.viewModel.launchSupportingScript("Quality Control");
              },
              isDisabled: function ($state, model) {
                return !model.getEditEnabled();
              },
              isIncluded: function ($state, model) {
                return (
                  model.viewModel.allowQualityControl &&
                  false === model.viewModel.hasQualityControl
                );
              },
            },
            {
              title: "Quality Control Complete",
              isDisabled: function ($state, model) {
                return !model.getEditEnabled();
              },
              isIncluded: function ($state, model) {
                return (
                  model.viewModel.allowQualityControl &&
                  true === model.viewModel.hasQualityControl
                );
              },
            },
            {
              title: "Proxy Initiation",
              operation: function ($state, model) {
                model.viewModel.launchSupportingScript("Proxy Initiation");
              },
              isDisabled: function ($state, model) {
                return !model.getEditEnabled();
              },
              isIncluded: function ($state, model) {
                return (
                  model.viewModel.allowProxyInitiation &&
                  false === model.viewModel.hasProxyInitiation
                );
              },
            },
            {
              title: "Reverse Proxy Initiation",
              operation: function ($state, model) {
                model.viewModel.reverseProxyInitiation();
              },
              isDisabled: function ($state, model) {
                return (
                  !model.getEditEnabled() &&
                  model.viewModel.reverseProxyInitiationDisabled
                );
              },
              isIncluded: function ($state, model) {
                return (
                  model.viewModel.allowProxyInitiation &&
                  true === model.viewModel.hasProxyInitiation &&
                  model.viewModel.allowReverseProxyInitiation
                );
              },
            },
            {
              title: "Withdraw",
              operation: function ($state, model) {
                model.viewModel.launchSupportingScript("Withdraw");
              },
              isDisabled: function ($state, model) {
                return !model.getEditEnabled();
              },
              isIncluded: function ($state, model) {
                return (
                  model.viewModel.allowWithdraw &&
                  false === model.viewModel.hasWithdraw
                );
              },
            },
            {
              title: "Reverse Withdraw",
              operation: function ($state, model) {
                model.viewModel.reverseWithdraw();
              },
              isDisabled: function ($state, model) {
                return (
                  !model.getEditEnabled() &&
                  model.viewModel.reverseWithdrawDisabled
                );
              },
              isIncluded: function ($state, model) {
                return (
                  model.viewModel.allowWithdraw &&
                  true === model.viewModel.hasWithdraw &&
                  model.viewModel.allowReverseWithdraw
                );
              },
            },
          ],
        });
      }
    } catch (err) {}

    try {
      var searchResultModule = cenozoApp.module("search_result");
      if (angular.isDefined(searchResultModule.actions.list)) {
        module.addExtraOperation("list", {
          title: "Search",
          isIncluded: function ($state, model) {
            return "participant" == model.getSubjectFromState();
          },
          operation: async function ($state, model) {
            await $state.go("search_result.list");
          },
        });
      }
    } catch (e) {
      // ignore missing module
      if (
        'Tried to load module "search_result" which doesn\'t exist.' !=
        e.message
      )
        throw e;
    }

    if (angular.isDefined(module.actions.import)) {
      module.addExtraOperation("list", {
        title: "Import",
        isIncluded: function ($state, model) {
          return "participant" == model.getSubjectFromState();
        },
        operation: async function ($state, model) {
          await $state.go("participant.import");
        },
      });
    }

    if (angular.isDefined(module.actions.multiedit)) {
      module.addExtraOperation("list", {
        title: "Multiedit",
        isIncluded: function ($state, model) {
          return "participant" == model.getSubjectFromState();
        },
        operation: async function ($state, model) {
          await $state.go("participant.multiedit");
        },
      });
    }

    try {
      var exportModule = cenozoApp.module("export");
      if (angular.isDefined(exportModule.actions.list)) {
        module.addExtraOperation("list", {
          title: "Export",
          isIncluded: function ($state, model) {
            return "participant" == model.getSubjectFromState();
          },
          operation: async function ($state, model) {
            await $state.go("export.list");
          },
        });
      }
    } catch (err) {}

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
            path: "participant/" + $state.params.identifier + "/address",
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

      Alternate: {
        active: true,
        framework: true,
        promise: async function (historyList, $state, CnHttpFactory) {
          var response = await CnHttpFactory.instance({
            path: "participant/" + $state.params.identifier + "/alternate",
            data: {
              select: {
                column: [
                  "create_timestamp",
                  "association",
                  "alternate_type_list",
                  "first_name",
                  "last_name",
                ],
              },
            },
          }).query();

          response.data.forEach((item) => {
            historyList.push({
              datetime: item.create_timestamp,
              category: "Alternate",
              title: "added " + item.first_name + " " + item.last_name,
              description:
                item.first_name +
                " " +
                item.last_name +
                " (" +
                (item.association ? item.association : "unknown association") +
                ")\n" +
                "Current roles: " +
                (item.alternate_type_list
                  ? item.alternate_type_list
                  : "(none)"),
            });
          });
        },
      },

      Consent: {
        active: true,
        framework: true,
        promise: async function (historyList, $state, CnHttpFactory) {
          var response = await CnHttpFactory.instance({
            path: "participant/" + $state.params.identifier + "/consent",
            data: {
              modifier: {
                join: {
                  table: "consent_type",
                  onleft: "consent.consent_type_id",
                  onright: "consent_type.id",
                },
                order: { datetime: true },
              },
              select: {
                column: [
                  "datetime",
                  "accept",
                  "written",
                  "note",
                  { table: "consent_type", column: "name" },
                  { table: "consent_type", column: "description" },
                ],
              },
            },
          }).query();

          response.data.forEach((item) => {
            historyList.push({
              datetime: item.datetime,
              category: "Consent",
              title:
                (item.written ? "Written" : "Verbal") +
                ' "' +
                item.name +
                '" ' +
                (item.accept ? "accepted" : "rejected"),
              description: item.description + "\n" + item.note,
            });
          });
        },
      },

      Event: {
        active: true,
        framework: true,
        promise: async function (historyList, $state, CnHttpFactory) {
          var response = await CnHttpFactory.instance({
            path: "participant/" + $state.params.identifier + "/event",
            data: {
              modifier: {
                join: {
                  table: "event_type",
                  onleft: "event.event_type_id",
                  onright: "event_type.id",
                },
                order: { datetime: true },
              },
              select: {
                column: [
                  "datetime",
                  { table: "event_type", column: "name" },
                  { table: "event_type", column: "description" },
                ],
              },
            },
          }).query();

          response.data.forEach((item) => {
            historyList.push({
              datetime: item.datetime,
              category: "Event",
              title: 'added "' + item.name + '"',
              description: item.description,
            });
          });
        },
      },

      Form: {
        active: true,
        framework: true,
        promise: async function (historyList, $state, CnHttpFactory) {
          var response = await CnHttpFactory.instance({
            path: "participant/" + $state.params.identifier + "/form",
            data: {
              modifier: {
                join: {
                  table: "form_type",
                  onleft: "form.form_type_id",
                  onright: "form_type.id",
                },
                order: { date: true },
              },
              select: {
                column: [
                  "date",
                  { table: "form_type", column: "name" },
                  { table: "form_type", column: "description" },
                ],
              },
            },
          }).query();

          response.data.forEach((item) => {
            historyList.push({
              datetime: item.date,
              category: "Form",
              title: 'added "' + item.name + '"',
              description: item.description,
            });
          });
        },
      },

      Hold: {
        active: true,
        framework: true,
        promise: async function (historyList, $state, CnHttpFactory) {
          var response = await CnHttpFactory.instance({
            path: "participant/" + $state.params.identifier + "/hold",
            data: {
              modifier: {
                join: {
                  table: "hold_type",
                  onleft: "hold.hold_type_id",
                  onright: "hold_type.id",
                  type: "left",
                },
                order: { datetime: true },
              },
              select: {
                column: [
                  "datetime",
                  { table: "hold_type", column: "name" },
                  { table: "hold_type", column: "type" },
                  { table: "hold_type", column: "description" },
                ],
              },
            },
          }).query();

          response.data.forEach((item) => {
            historyList.push({
              datetime: item.datetime,
              category: "Hold",
              title:
                null == item.type
                  ? "removed hold"
                  : 'added "' + item.type + " " + item.name + '"',
              description: null == item.type ? "" : item.description,
            });
          });
        },
      },

      Mail: {
        active: true,
        framework: true,
        promise: async function (historyList, $state, CnHttpFactory) {
          var response = await CnHttpFactory.instance({
            path: "participant/" + $state.params.identifier + "/mail",
            data: {
              select: { column: ["sent_datetime", "subject", "note"] },
              modifier: {
                where: { column: "sent_datetime", operator: "!=", value: null },
              },
            },
          }).query();

          response.data.forEach((item) => {
            historyList.push({
              datetime: item.sent_datetime,
              category: "Mail",
              title: 'sent "' + item.subject + '"',
              description: item.note,
            });
          });
        },
      },

      Note: {
        active: true,
        framework: true,
        promise: async function (historyList, $state, CnHttpFactory) {
          var response = await CnHttpFactory.instance({
            path: "participant/" + $state.params.identifier + "/note",
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
            path: "participant/" + $state.params.identifier + "/phone",
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

      Proxy: {
        active: true,
        framework: true,
        promise: async function (historyList, $state, CnHttpFactory) {
          var response = await CnHttpFactory.instance({
            path: "participant/" + $state.params.identifier + "/proxy",
            data: {
              modifier: {
                join: {
                  table: "proxy_type",
                  onleft: "proxy.proxy_type_id",
                  onright: "proxy_type.id",
                  type: "left",
                },
                order: { datetime: true },
              },
              select: {
                column: [
                  "datetime",
                  { table: "proxy_type", column: "name" },
                  { table: "proxy_type", column: "description" },
                ],
              },
            },
          }).query();

          response.data.forEach((item) => {
            historyList.push({
              datetime: item.datetime,
              category: "Proxy",
              title:
                null == item.name
                  ? "removed proxy"
                  : 'added proxy: "' + item.name + '"',
              description: null == item.name ? "" : item.description,
            });
          });
        },
      },

      Trace: {
        active: true,
        framework: true,
        promise: async function (historyList, $state, CnHttpFactory) {
          var response = await CnHttpFactory.instance({
            path: "participant/" + $state.params.identifier + "/trace",
            data: {
              modifier: {
                join: {
                  table: "trace_type",
                  onleft: "trace.trace_type_id",
                  onright: "trace_type.id",
                  type: "left",
                },
                order: { datetime: true },
              },
              select: {
                column: [
                  "datetime",
                  "note",
                  { table: "trace_type", column: "name" },
                  { table: "user", column: "first_name" },
                  { table: "user", column: "last_name" },
                ],
              },
            },
          }).query();

          response.data.forEach((item) => {
            historyList.push({
              datetime: item.datetime,
              category: "Trace",
              title:
                (null == item.name
                  ? "removed trace"
                  : 'added to "' + item.name + '"') +
                " by " +
                item.first_name +
                " " +
                item.last_name,
              description: item.note,
            });
          });
        },
      },
    };

    // add the assignment category if the module exists
    try {
      cenozoApp.module("assignment");
      module.historyCategoryList.Assignment = {
        active: true,
        promise: async function (historyList, $state, CnHttpFactory) {
          var response = await CnHttpFactory.instance({
            path: "participant/" + $state.params.identifier + "/interview",
            data: {
              modifier: { order: { start_datetime: true } },
              select: { column: ["id"] },
            },
          }).query();

          await Promise.all(
            response.data.map(async (participant) => {
              var subResponse = await CnHttpFactory.instance({
                path: "interview/" + participant.id + "/assignment",
                data: {
                  modifier: { order: { start_datetime: true } },
                  select: {
                    column: [
                      "start_datetime",
                      "end_datetime",
                      {
                        table: "user",
                        column: "first_name",
                        alias: "user_first",
                      },
                      {
                        table: "user",
                        column: "last_name",
                        alias: "user_last",
                      },
                      { table: "site", column: "name", alias: "site" },
                      { table: "script", column: "name", alias: "script" },
                    ],
                  },
                },
              }).query();

              subResponse.data.forEach((assignment) => {
                if (null != assignment.start_datetime) {
                  historyList.push({
                    datetime: assignment.start_datetime,
                    category: "Assignment",
                    title:
                      "started by " +
                      assignment.user_first +
                      " " +
                      assignment.user_last,
                    description:
                      'Started an assignment for the "' +
                      assignment.script +
                      '" questionnaire.\n' +
                      "Assigned from the " +
                      assignment.site +
                      " site.",
                  });
                }
                if (null != assignment.end_datetime) {
                  historyList.push({
                    datetime: assignment.end_datetime,
                    category: "Assignment",
                    title:
                      "completed by " +
                      assignment.user_first +
                      " " +
                      assignment.user_last,
                    description:
                      'Completed an assignment for the "' +
                      assignment.script +
                      '" questionnaire.\n' +
                      "Assigned from the " +
                      assignment.site +
                      " site.",
                  });
                }
              });
            })
          );
        },
      };
    } catch (err) {}

    /* ############################################################################################## */
    cenozo.providers.directive("cnParticipantHistory", [
      "CnParticipantHistoryFactory",
      "CnSession",
      "CnHttpFactory",
      "$state",
      function (CnParticipantHistoryFactory, CnSession, CnHttpFactory, $state) {
        return {
          templateUrl: cenozo.getFileUrl("cenozo", "history.tpl.html"),
          restrict: "E",
          controller: async function ($scope) {
            $scope.isLoading = false;
            $scope.model = CnParticipantHistoryFactory.instance();

            var response = await CnHttpFactory.instance({
              path: "participant/" + $state.params.identifier,
              data: { select: { column: ["uid", "first_name", "last_name"] } },
            }).get();
            $scope.uid = response.data.uid;
            $scope.name =
              response.data.first_name +
              " " +
              response.data.last_name +
              " (" +
              response.data.uid +
              ")";

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
              try {
                $scope.isLoading = true;
                await $scope.model.onView();
                CnSession.setBreadcrumbTrail([
                  {
                    title: "Participants",
                    go: async function () {
                      await $state.go("participant.list");
                    },
                  },
                  {
                    title: $scope.uid,
                    go: async function () {
                      await $state.go("participant.view", {
                        identifier: $state.params.identifier,
                      });
                    },
                  },
                  {
                    title: "History",
                  },
                ]);
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
    cenozo.providers.directive("cnParticipantImport", [
      "CnParticipantImportFactory",
      "CnSession",
      "$state",
      "$timeout",
      function (CnParticipantImportFactory, CnSession, $state, $timeout) {
        return {
          templateUrl: module.getFileUrl("import.tpl.html"),
          restrict: "E",
          controller: function ($scope) {
            $scope.model = CnParticipantImportFactory.instance();
            $scope.tab = "participant";
            CnSession.setBreadcrumbTrail([
              {
                title: "Participants",
                go: async function () {
                  await $state.go("participant.list");
                },
              },
              {
                title: "Multi-Edit",
              },
            ]);
          },
        };
      },
    ]);

    /* ############################################################################################## */
    cenozo.providers.directive("cnParticipantMultiedit", [
      "CnParticipantMultieditFactory",
      "CnSession",
      "$state",
      function (CnParticipantMultieditFactory, CnSession, $state) {
        return {
          templateUrl: module.getFileUrl("multiedit.tpl.html"),
          restrict: "E",
          controller: function ($scope) {
            $scope.model = CnParticipantMultieditFactory.instance();
            $scope.tab = "participant";
            CnSession.setBreadcrumbTrail([
              {
                title: "Participants",
                go: async function () {
                  await $state.go("participant.list");
                },
              },
              {
                title: "Multi-Edit",
              },
            ]);
          },
        };
      },
    ]);

    /* ############################################################################################## */
    cenozo.providers.directive("cnParticipantNotes", [
      "CnParticipantNotesFactory",
      function (CnParticipantNotesFactory) {
        return {
          templateUrl: cenozo.getFileUrl("cenozo", "notes.tpl.html"),
          restrict: "E",
          controller: async function ($scope) {
            angular.extend($scope, {
              model: CnParticipantNotesFactory.instance(),

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
    cenozo.providers.factory("CnParticipantViewFactory", [
      "CnBaseViewFactory",
      "CnSession",
      "CnHttpFactory",
      "CnModalMessageFactory",
      "CnModalConfirmFactory",
      "CnScriptLauncherFactory",
      "$window",
      "$state",
      function (
        CnBaseViewFactory,
        CnSession,
        CnHttpFactory,
        CnModalMessageFactory,
        CnModalConfirmFactory,
        CnScriptLauncherFactory,
        $window,
        $state
      ) {
        var object = function (parentModel, root) {
          CnBaseViewFactory.construct(this, parentModel, root, "address");

          angular.extend(this, {
            onViewPromise: null,
            scriptLaunchers: {},
            hasDecedent: null,
            hasQualityControl: null,
            hasWithdraw: null,
            allowDecedent: false,
            allowProxyInitiation: false,
            allowQualityControl: false,
            allowWithdraw: false,
            allowReverseWithdraw: 3 <= CnSession.role.tier,
            allowReverseProxyInitiation: true,

            useTimezone: async function () {
              await CnSession.setTimezone({ participant_id: this.record.id });
              await $state.go("self.wait");
              await $window.location.reload();
            },

            getChildTitle: function (child) {
              let title = this.$$getChildTitle(child);

              // change some of the default titles
              if ("study" == child.subject.snake) {
                title = title.replace("Study", "Eligible Study");
              }

              return title;
            },

            onView: async function (force) {
              // always assume that the decedent script is not allowed (until more details are found below)
              angular.extend(this, {
                hasDecedent: null,
                hasQualityControl: null,
                hasWithdraw: null,
                allowDecedent:
                  "mastodon" == CnSession.application.type &&
                  CnSession.role.allSites,
                allowQualityControl: false,
                allowWithdraw: false,
              });

              // only create launchers for each supporting script if the script module is activated
              if (CnSession.moduleList.includes("script")) {
                // note: there's no need to wait for these calls so there's no "Promise.all" here
                var self = this;
                CnSession.supportingScriptList.forEach(async (script) => {
                  if (null != script.name.match(/Decedent/)) {
                    // only check for the decedent token if we're allowed to launch the script
                    this.allowDecedent =
                      "mastodon" == CnSession.application.type &&
                      CnSession.role.allSites;
                    if (this.allowDecedent) {
                      var name = "Decedent";
                      this.scriptLaunchers[name] =
                        CnScriptLauncherFactory.instance({
                          script: script,
                          identifier:
                            this.parentModel.getQueryParameter("identifier"),
                          onReady: function () {
                            self.hasDecedent =
                              null != this.token && (
                              'limesurvey' == script.application ?
                                null != this.token.completed.match( /[0-9]{4}-(0[1-9])|(1[0-2])-[0-3][0-9]/ ) :
                                null != this.token.end_datetime
                            );
                          },
                        });
                      try {
                        await this.scriptLaunchers[name].initialize();
                      } catch (error) {}
                    }
                  } else if (null != script.name.match(/Proxy Initiation/)) {
                    var name = "Proxy Initiation";
                    this.allowProxyInitiation = true;
                    this.scriptLaunchers[name] =
                      CnScriptLauncherFactory.instance({
                        script: script,
                        identifier:
                          this.parentModel.getQueryParameter("identifier"),
                        onReady: function () {
                          self.hasProxyInitiation =
                            null != this.token && (
                            'limesurvey' == script.application ?
                              null != this.token.completed.match( /[0-9]{4}-(0[1-9])|(1[0-2])-[0-3][0-9]/ ) :
                              null != this.token.end_datetime
                          );
                        },
                      });
                    try {
                      await this.scriptLaunchers[name].initialize();
                    } catch (error) {}
                  } else if (null != script.name.match(/Quality Control/)) {
                    var name = "Quality Control";
                    this.allowQualityControl = true;
                    this.scriptLaunchers[name] =
                      CnScriptLauncherFactory.instance({
                        script: script,
                        identifier:
                          this.parentModel.getQueryParameter("identifier"),
                        onReady: function () {
                          self.hasQualityControl =
                            null != this.token && (
                            'limesurvey' == script.application ?
                              null != this.token.completed.match( /[0-9]{4}-(0[1-9])|(1[0-2])-[0-3][0-9]/ ) :
                              null != this.token.end_datetime
                          );
                        },
                      });
                    try {
                      await this.scriptLaunchers[name].initialize();
                    } catch (error) {}
                  } else if (null != script.name.match(/Withdraw/)) {
                    var name = "Withdraw";
                    this.allowWithdraw = true;
                    this.scriptLaunchers[name] =
                      CnScriptLauncherFactory.instance({
                        script: script,
                        identifier:
                          this.parentModel.getQueryParameter("identifier"),
                        onReady: function () {
                          self.hasWithdraw =
                            null != this.token && (
                            'limesurvey' == script.application ?
                              null != this.token.completed.match( /[0-9]{4}-(0[1-9])|(1[0-2])-[0-3][0-9]/ ) :
                              null != this.token.end_datetime
                          );
                        },
                      });
                    try {
                      await this.scriptLaunchers[name].initialize();
                    } catch (error) {}
                  }
                });
              }

              // set a special heading
              this.onViewPromise = await this.$$onView(force);

              // put the participant's full name in the heading
              var nameList = [this.record.first_name, this.record.last_name];
              if (this.record.other_name)
                nameList.splice(1, 0, "(" + this.record.other_name + ")");
              if (this.record.honorific)
                nameList.unshift(this.record.honorific);
              this.heading = "Participant Details for " + nameList.join(" ");

              if (null != this.record.date_of_death) {
                // only display the accurate parts of the date-of-death
                if ("day unknown" == this.record.date_of_death_accuracy) {
                  this.formattedRecord.date_of_death =
                    this.formattedRecord.date_of_death.replace(/ [0-9]+,/, ",");
                } else if (
                  "month and day unknown" == this.record.date_of_death_accuracy
                ) {
                  this.formattedRecord.date_of_death =
                    this.formattedRecord.date_of_death.replace(
                      /[A-Za-z]+ [0-9]+,/,
                      ""
                    );
                }

                // if the date of death is defined then show age of death instead of current age
                var age = moment(this.record.date_of_death).diff(
                  this.record.date_of_birth,
                  "years"
                );
                this.formattedRecord.date_of_birth =
                  this.formattedRecord.date_of_birth.replace(/ \(.*\)/, "");
                this.formattedRecord.date_of_death +=
                  " (" + age + " year" + (1 == age ? "" : "s") + " old)";
              }

              // don't allow excluded participants to be edited
              var self = this;
              this.parentModel.getEditEnabled = function () {
                return (
                  this.$$getEditEnabled() &&
                  null != self.record.exclusion &&
                  null == self.record.exclusion.match(/^No/)
                );
              };
            },

            onPatch: async function (data) {
              // warn non all-sites users when changing the preferred site
              if (
                angular.isDefined(data.preferred_site_id) &&
                !CnSession.role.allSites
              ) {
                if (
                  ("" === data.preferred_site_id &&
                    this.record.default_site != CnSession.site.name) ||
                  ("" !== data.preferred_site_id &&
                    data.preferred_site_id != CnSession.site.id)
                ) {
                  var assignedParticipant =
                    null != CnSession.user.assignment &&
                    this.record.id == CnSession.user.assignment.participant_id;
                  var message =
                    "Are you sure you wish to change this participant's preferred site?\n\n";
                  message += assignedParticipant
                    ? "By selecting yes you will continue to have access to this participant until your " +
                      "assignment is complete, after which you will no longer have access to this participant."
                    : "By selecting yes you will no longer have access to this participant and will be " +
                      "sent back to your home screen.";
                  var response = await CnModalConfirmFactory.instance({
                    title: "Change Preferred Site",
                    message: message,
                  }).show();
                  if (response) {
                    await this.$$onPatch(data);
                    if (!assignedParticipant) await $state.go("root.home");
                  } else {
                    this.record.preferred_site_id =
                      this.backupRecord.preferred_site_id;
                  }
                }
              }

              await this.$$onPatch(data);

              // refresh the data if date-of-death information has changed
              if (
                angular.isDefined(data.date_of_death) ||
                angular.isDefined(data.date_of_death_accuracy)
              )
                await this.onView();
            },

            // reverses the participant's withdraw status
            reverseWithdrawDisabled: false,
            reverseWithdraw: async function () {
              this.reverseWithdrawDisabled = true;
              var response = await CnModalConfirmFactory.instance({
                title: "Reverse Withdraw",
                message:
                  "Are you sure you wish to reverse this participant's withdraw status?\n\n" +
                  "By selecting yes you are confirming that the participant has re-consented to " +
                  "participate in the study.",
              }).show();

              try {
                if (response) {
                  await CnHttpFactory.instance({
                    path: this.parentModel.getServiceResourcePath(),
                    data: { reverse_withdraw: true },
                  }).patch();

                  await this.onView();
                  if (this.consentModel)
                    await this.consentModel.listModel.onList(true);
                }
              } finally {
                this.reverseWithdrawDisabled = false;
              }
            },

            // reverses the participant's proxy initiation status
            reverseProxyInitiationDisabled: false,
            reverseProxyInitiation: async function () {
              this.reverseProxyInitiationDisabled = true;
              var response = await CnModalConfirmFactory.instance({
                title: "Reverse Proxy Initiation",
                message:
                  "Are you sure you wish to reverse this participant's proxy status?\n\n" +
                  "By selecting yes you are confirming that the participant has decided to re-consider " +
                  "their proxy status.",
              }).show();

              try {
                if (response) {
                  await CnHttpFactory.instance({
                    path: this.parentModel.getServiceResourcePath(),
                    data: { reverse_proxy_initiation: true },
                  }).patch();

                  await this.onView();
                  if (this.consentModel)
                    await this.consentModel.listModel.onList(true);
                  if (this.proxyModel)
                    await this.proxyModel.listModel.onList(true);
                }
              } finally {
                this.reverseProxyInitiationDisabled = false;
              }
            },
          });

          // only add script launching if the script module is activated
          if (CnSession.moduleList.includes("script")) {
            this.launchSupportingScript = function (scriptName) {
              var foundLauncher = null;
              if (angular.isUndefined(this.scriptLaunchers[scriptName]))
                throw new Error(
                  'Cannot launch supporting script "' +
                    scriptName +
                    '", script not found.'
                );

              var language =
                this.parentModel.metadata.columnList.language_id.enumList.findByProperty(
                  "value",
                  this.record.language_id
                );
              if (language)
                this.scriptLaunchers[scriptName].lang = language.code;

              var urlParams = { show_hidden: 1 };
              this.scriptLaunchers[scriptName].launch( urlParams );

              // check for when the window gets focus back and update the participant details
              var win = angular.element($window).on("focus", async () => {
                await this.onView();
                if (this.consentModel) this.consentModel.listModel.onList(true);
                if (this.proxyModel) this.proxyModel.listModel.onList(true);
                if (this.holdModel) this.holdModel.listModel.onList(true);
                win.off("focus");
              });
            };
          }

          async function init(object) {
            if (root) {
              await object.deferred.promise;

              // override the collection model's getServiceData function (list active collections only)
              if (object.collectionModel) {
                object.collectionModel.getServiceData = function (
                  type,
                  columnRestrictLists
                ) {
                  var data = object.collectionModel.$$getServiceData(
                    type,
                    columnRestrictLists
                  );
                  if (angular.isUndefined(data.modifier))
                    data.modifier = { where: [] };
                  else if (angular.isUndefined(data.modifier.where))
                    data.modifier.where = [];
                  data.modifier.where.push({
                    column: "collection.active",
                    operator: "=",
                    value: true,
                  });
                  return data;
                };
              }

              if (angular.isDefined(object.applicationModel)) {
                object.applicationModel.getViewEnabled = function () {
                  return false;
                };
                object.applicationModel.addColumn("default_site", {
                  title: "Default Site",
                  column: "default_site.name",
                });
                object.applicationModel.addColumn("preferred_site", {
                  title: "Preferred Site",
                  column: "preferred_site.name",
                });
                object.applicationModel.addColumn("datetime", {
                  title: "Release Date & Time",
                  column: "datetime",
                  type: "datetime",
                });
                object.applicationModel.listModel.heading = "Release List";
              }

              // only allow adding a hold or proxy if the participant is enrolled
              if (object.holdModel) {
                object.holdModel.getAddEnabled = function () {
                  return (
                    object.holdModel.$$getAddEnabled() &&
                    "Yes" == object.record.exclusion
                  );
                };
                object.proxyModel.getAddEnabled = function () {
                  return (
                    object.proxyModel.$$getAddEnabled() &&
                    "Yes" == object.record.exclusion
                  );
                };
              }
            }

            if (angular.isDefined(object.studyModel)) {
              object.studyModel.getChooseEnabled = function () {
                return 3 <= CnSession.role.tier && parentModel.getEditEnabled();
              };
            }
          }

          init(this);
        };

        return {
          instance: function (parentModel, root) {
            return new object(parentModel, root);
          },
        };
      },
    ]);

    /* ############################################################################################## */
    cenozo.providers.factory("CnParticipantModelFactory", [
      "CnBaseModelFactory",
      "CnParticipantListFactory",
      "CnParticipantViewFactory",
      "CnHttpFactory",
      "CnSession",
      function (
        CnBaseModelFactory,
        CnParticipantListFactory,
        CnParticipantViewFactory,
        CnHttpFactory,
        CnSession
      ) {
        var object = function (root) {
          CnBaseModelFactory.construct(this, module);
          this.listModel = CnParticipantListFactory.instance(this);
          if (root)
            this.viewModel = CnParticipantViewFactory.instance(this, root);

          angular.extend(this, {
            hasIdentifier: null != CnSession.application.identifier,

            // extend getMetadata
            getMetadata: async function () {
              await this.$$getMetadata();

              var [availabilityTypeResponse, languageResponse, siteResponse] =
                await Promise.all([
                  CnHttpFactory.instance({
                    path: "availability_type",
                    data: {
                      select: { column: ["id", "name"] },
                      modifier: { order: "name", limit: 1000 },
                    },
                  }).query(),

                  CnHttpFactory.instance({
                    path: "language",
                    data: {
                      select: { column: ["id", "name", "code"] },
                      modifier: {
                        where: { column: "active", operator: "=", value: true },
                        order: "name",
                        limit: 1000,
                      },
                    },
                  }).query(),

                  CnHttpFactory.instance({
                    path: "site",
                    data: {
                      select: { column: ["id", "name"] },
                      modifier: { order: "name", limit: 1000 },
                    },
                  }).query(),
                ]);

              this.metadata.columnList.availability_type_id.enumList =
                availabilityTypeResponse.data.reduce((list, item) => {
                  list.push({ value: item.id, name: item.name });
                  return list;
                }, []);

              this.metadata.columnList.language_id.enumList =
                languageResponse.data.reduce((list, item) => {
                  // code is needed by the withdraw action
                  list.push({
                    value: item.id,
                    name: item.name,
                    code: item.code,
                  });
                  return list;
                }, []);

              this.metadata.columnList.preferred_site_id = { enumList: [] };
              this.metadata.columnList.preferred_site_id.enumList =
                siteResponse.data.reduce((list, item) => {
                  list.push({ value: item.id, name: item.name });
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

    /* ############################################################################################## */
    cenozo.providers.factory("CnParticipantHistoryFactory", [
      "CnBaseHistoryFactory",
      "CnParticipantModelFactory",
      function (CnBaseHistoryFactory, CnParticipantModelFactory) {
        var object = function () {
          CnBaseHistoryFactory.construct(
            this,
            module,
            CnParticipantModelFactory.root
          );
        };

        return {
          instance: function () {
            return new object(false);
          },
        };
      },
    ]);

    /* ############################################################################################## */
    cenozo.providers.factory("CnParticipantImportFactory", [
      "CnParticipantModelFactory",
      "CnAddressModelFactory",
      "CnPhoneModelFactory",
      "CnSession",
      "CnHttpFactory",
      "CnModalMessageFactory",
      function (
        CnParticipantModelFactory,
        CnAddressModelFactory,
        CnPhoneModelFactory,
        CnSession,
        CnHttpFactory,
        CnModalMessageFactory
      ) {
        var object = function () {
          angular.extend(this, {
            parentModel: CnParticipantModelFactory.root,
            addressModel: CnAddressModelFactory.root,
            phoneModel: CnPhoneModelFactory.root,
            sourceList: [],
            cohortList: [],
            sexList: [],
            languageList: [],
            availabilityTypeList: [],
            phoneTypeList: [],
            defaultPostcode: CnSession.application.defaultPostcode,
            importFile: {
              file: null,
              size: null,
              processing: false,
              model: null,
              download: function () {},
              remove: function () {},
              upload: function () {
                var obj = this;
                obj.processing = true;
                var data = new FormData();
                data.append("file", obj.file);
                var fileDetails = data.get("file");

                var read = new FileReader();
                read.readAsText(fileDetails);
                read.onloadend = async function () {
                  var validColumnCount = 0;
                  var csv = read.result.parseCSV();

                  var message =
                    "There were no valid columns in the first line of the file. " +
                    "Please check that the first line of the CSV file contains the column names from the list above.";

                  try {
                    if (0 < csv.length) {
                      // assume the first line is a header
                      var columnLookup = csv
                        .shift()
                        .map((column) =>
                          column.trim().toLowerCase().replace(" ", "_")
                        );
                      columnLookup.forEach((column, index) => {
                        // check for regular column names and multi (address and phone) column names
                        if (
                          !validColumnList.includes(column) &&
                          !validMultiColumnList.includes(
                            column.replace(/_[0-9]+$/, "")
                          )
                        ) {
                          columnLookup[index] = null;
                        } else {
                          validColumnCount++;
                        }
                      });

                      var participantList = [];
                      if (validColumnCount) {
                        // go through all lines which aren't empty
                        csv
                          .filter((line) => line.length)
                          .forEach((line) => {
                            var participant = {};
                            line.forEach((value, index) => {
                              if (
                                null !== columnLookup[index] &&
                                null !== value
                              )
                                participant[columnLookup[index]] = value;
                            });

                            // don't add participants which only have empty values
                            if (Object.keys(participant).length)
                              participantList.push(participant);
                          });

                        // now send the list of participants to the server
                        var response = await CnHttpFactory.instance({
                          path: "participant",
                          data: participantList,
                        }).post();
                        message =
                          "A total of " +
                          (participantList.length - response.length) +
                          " out of " +
                          participantList.length +
                          " participants have been imported." +
                          (0 < response.length
                            ? "\n\n" + response.join("\n")
                            : "");
                      }
                    }

                    await CnModalMessageFactory.instance({
                      title: validColumnCount
                        ? "Import Results"
                        : "Unable to Parse File",
                      message: message,
                      error: !validColumnCount,
                    }).show();
                  } finally {
                    obj.processing = false;
                  }
                };
              },
            },
            loading: true,
          });

          var validColumnList = [
            "source",
            "cohort",
            "grouping",
            "honorific",
            "first_name",
            "other_name",
            "last_name",
            "sex",
            "date_of_birth",
            "language",
            "availability_type",
            "callback",
            "email",
            "mass_email",
            "low_education",
            "global_note",
          ];

          var validMultiColumnList = [
            "address1",
            "address2",
            "city",
            "postcode",
            "address_note",
            "phone_type",
            "phone_number",
            "link_phone_to_address",
            "phone_note",
          ];

          async function init(object) {
            try {
              await object.parentModel.metadata.getPromise();
              object.sexList =
                object.parentModel.metadata.columnList.sex.enumList.map(
                  (row) => row.name
                );

              await object.addressModel.metadata.getPromise();
              await object.phoneModel.metadata.getPromise();
              object.phoneTypeList =
                object.phoneModel.metadata.columnList.type.enumList.map(
                  (row) => row.name
                );

              // get the source list
              var response = await CnHttpFactory.instance({
                path: "source",
                data: {
                  select: { column: "name" },
                  modifier: { order: "name" },
                },
              }).query();
              object.sourceList = response.data.map((row) => row.name);

              // get the cohort list
              var response = await CnHttpFactory.instance({
                path: "cohort",
                data: {
                  select: { column: "name" },
                  modifier: { order: "name" },
                },
              }).query();
              object.cohortList = response.data.map((row) => row.name);

              // get the language list
              var response = await CnHttpFactory.instance({
                path: "language",
                data: {
                  select: { column: "code" },
                  modifier: {
                    where: { column: "active", operator: "=", value: true },
                    order: "code",
                  },
                },
              }).query();
              object.languageList = response.data.map((row) => row.code);

              // get the availability_type list
              var response = await CnHttpFactory.instance({
                path: "availability_type",
                data: {
                  select: { column: "name" },
                  modifier: { order: "name" },
                },
              }).query();
              object.availabilityTypeList = response.data.map(
                (row) => row.name
              );
            } finally {
              object.loading = false;
            }
          }

          // this is a contructor function so don't await the init() function
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
    cenozo.providers.factory("CnParticipantMultieditFactory", [
      "CnSession",
      "CnHttpFactory",
      "CnParticipantSelectionFactory",
      "CnModalDatetimeFactory",
      "CnModalMessageFactory",
      "CnConsentModelFactory",
      "CnEventModelFactory",
      "CnHoldModelFactory",
      "CnParticipantModelFactory",
      "CnProxyModelFactory",
      function (
        CnSession,
        CnHttpFactory,
        CnParticipantSelectionFactory,
        CnModalDatetimeFactory,
        CnModalMessageFactory,
        CnConsentModelFactory,
        CnEventModelFactory,
        CnHoldModelFactory,
        CnParticipantModelFactory,
        CnProxyModelFactory
      ) {
        var object = function () {
          angular.extend(this, {
            module: module,
            participantSelection: CnParticipantSelectionFactory.instance(),
            activeInput: "",
            hasActiveInputs: false,
            participantInputList: null,
            consentInputList: null,
            collectionList: null,
            collectionOperation: "add",
            collectionId: undefined,
            eventInputList: null,
            holdInputList: null,
            proxyInputList: null,
            note: { sticky: 0, note: "" },
            studyList: null,
            studyOperation: "add",
            studyId: undefined,

            selectDatetime: async function (input) {
              var response = await CnModalDatetimeFactory.instance({
                title: input.title,
                date: input.value,
                minDate: angular.isDefined(input.min) ? input.min : input.min,
                maxDate: angular.isDefined(input.max) ? input.max : input.max,
                pickerType: input.type,
                emptyAllowed: !input.required,
              }).show();

              if (false !== response) {
                input.value = response;
                input.formattedValue = CnSession.formatValue(
                  response,
                  input.type,
                  true
                );
              }
            },

            activateInput: function (column) {
              if (column) {
                this.participantInputList.findByProperty(
                  "column",
                  column
                ).active = true;
                this.hasActiveInputs = true;
                if (column == this.activeInput) this.activeInput = "";
              }
            },

            deactivateInput: function (column) {
              this.participantInputList.findByProperty(
                "column",
                column
              ).active = false;
              this.hasActiveInputs =
                0 <
                this.participantInputList.filter((input) => input.active)
                  .length;
            },

            applyMultiedit: async function (type) {
              // test the formats of all columns
              var error = false;
              var messageObj = { title: null, message: null };
              var identifierList =
                this.participantSelection.getIdentifierList();
              if ("consent" == type) {
                var inputList = this.consentInputList;
                var model = CnConsentModelFactory.root;
                messageObj.title = "Consent Records Added";
                messageObj.message =
                  "The consent record has been successfully added to <TOTAL> participant(s).";
              } else if ("collection" == type) {
                // handle the collection id specially
                var element =
                  cenozo.getScopeByQuerySelector("#collectionId").innerForm
                    .name;
                element.$error.format = false;
                cenozo.updateFormElement(element, true);
                error = error || element.$invalid;
                messageObj.title = "Collection Updated";
                messageObj.message =
                  "The participant list has been " +
                  ("add" == this.collectionOperation
                    ? "added to "
                    : "removed from ") +
                  'the "' +
                  this.collectionList.findByProperty("id", this.collectionId)
                    .name +
                  '" ' +
                  "collection";
              } else if ("event" == type) {
                var inputList = this.eventInputList;
                var model = CnEventModelFactory.root;
                messageObj.title = "Event Records Added";
                messageObj.message =
                  "The event record has been successfully added to <TOTAL> participant(s).";
              } else if ("hold" == type) {
                var inputList = this.holdInputList;
                var model = CnHoldModelFactory.root;
                messageObj.title = "Hold Records Added";
                messageObj.message =
                  "The hold record has been successfully added to <TOTAL> participant(s).";
              } else if ("note" == type) {
                var inputList = this.noteInputList;
                var model = null;
                messageObj.title = "Note Records Added";
                messageObj.message =
                  "The note record has been successfully added to <TOTAL> participant(s).";
              } else if ("participant" == type) {
                var inputList = this.participantInputList.filter(
                  (input) => input.active
                );
                var model = CnParticipantModelFactory.root;
                messageObj.title = "Participant Details Updated";
                messageObj.message =
                  "The listed details have been successfully updated on " +
                  identifierList.length +
                  " participant records.";
              } else if ("proxy" == type) {
                var inputList = this.proxyInputList;
                var model = CnProxyModelFactory.root;
                messageObj.title = "Proxy Records Added";
                messageObj.message =
                  "The proxy record has been successfully added to <TOTAL> participant(s).";
              } else if ("study" == type) {
                // handle the study id specially
                var element =
                  cenozo.getScopeByQuerySelector("#studyId").innerForm.name;
                element.$error.format = false;
                cenozo.updateFormElement(element, true);
                error = error || element.$invalid;
                messageObj.title = "Study Eligibility Updated";
                messageObj.message =
                  "The participant list has been " +
                  ("add" == this.studyOperation
                    ? "added to "
                    : "removed from ") +
                  'the "' +
                  this.studyList.findByProperty("id", this.studyId).name +
                  '" ' +
                  "study";
              } else
                throw new Error(
                  'Called addRecords() with invalid type "' + type + '".'
                );

              if (inputList) {
                inputList.forEach((input) => {
                  var element = cenozo.getFormElement(input.column);
                  if (element) {
                    var valid = model.testFormat(input.column, input.value);
                    element.$error.format = !valid;
                    cenozo.updateFormElement(element, true);
                    error = error || element.$invalid;
                  }
                });
              }

              if (!error) {
                var data = {
                  identifier_id: this.participantSelection.identifierId,
                  identifier_list: identifierList,
                };
                if ("collection" == type) {
                  data.collection = {
                    id: this.collectionId,
                    operation: this.collectionOperation,
                  };
                } else if ("note" == type) {
                  data.note = this.note;
                } else if ("participant" == type) {
                  data.input_list = {};
                  inputList.forEach(
                    (input) => (data.input_list[input.column] = input.value)
                  );
                } else if ("study" == type) {
                  data.study = {
                    id: this.studyId,
                    operation: this.studyOperation,
                  };
                } else {
                  data[type] = inputList.reduce((record, input) => {
                    record[input.column] = input.value;
                    return record;
                  }, {});
                }

                var response = await CnHttpFactory.instance({
                  path: "participant",
                  data: data,
                  onError: CnModalMessageFactory.httpError,
                }).post();

                // some messages have a <TOTAL> in them, so fill it in (the number of records created)
                messageObj.message = messageObj.message.replace(
                  "<TOTAL>",
                  response.data
                );
                var messageModal = CnModalMessageFactory.instance(messageObj);
                await messageModal.show();
              }
            },
          });

          // given a module and metadata this function will build an input list
          function processInputList(list, module, metadata) {
            list.forEach((column, index, array) => {
              // find this column's input details in the module's input group list
              var input = null;
              module.inputGroupList.some((group) => {
                for (var groupListColumn in group.inputList) {
                  if (column == groupListColumn) {
                    input = group.inputList[groupListColumn];
                    return true; // stop looping over inputGroupList
                  }
                }
              });

              if (null != input) {
                // convert the column name into an object
                array[index] = {
                  column: column,
                  title: input.title,
                  type: input.type,
                  min: input.min,
                  max: input.max,
                  active: false,
                  value:
                    null == metadata[column].default
                      ? null
                      : String(metadata[column].default),
                  required: metadata[column].required,
                  max_length: metadata[column].max_length,
                  enumList: angular.copy(metadata[column].enumList),
                };

                // Inputs with enum types need to do a bit of extra work with the enumList and default value
                if ("boolean" == array[index].type) {
                  // set not as the default value
                  if (null == array[index].value) array[index].value = "0";
                } else if ("enum" == array[index].type) {
                  if (!array[index].required) {
                    // enums which are not required should have an empty value
                    array[index].enumList.unshift({
                      value: "",
                      name: "(empty)",
                    });
                  }

                  // always select the first value, whatever it is
                  array[index].value = array[index].enumList[0].value;
                } else if (cenozo.isDatetimeType(array[index].type)) {
                  array[index].formattedValue = "(empty)";
                }
              }
            });

            return list;
          }

          async function init(object) {
            // populate the participant input list once the participant's metadata has been loaded
            await CnParticipantModelFactory.root.metadata.getPromise();
            object.participantInputList = processInputList(
              [
                "honorific",
                "sex",
                "current_sex",
                "language_id",
                "availability_type_id",
                "preferred_site_id",
                "out_of_area",
                "email",
                "email2",
                "mass_email",
                "note",
              ],
              object.module,
              CnParticipantModelFactory.root.metadata.columnList
            );

            // add the placeholder to the column list
            object.participantInputList.unshift({
              active: false,
              column: "",
              title: "Select which column to edit",
            });

            // populate the consent input list once the consent's metadata has been loaded
            await CnConsentModelFactory.root.metadata.getPromise();
            object.consentInputList = processInputList(
              ["consent_type_id", "accept", "written", "datetime", "note"],
              cenozoApp.module("consent"),
              CnConsentModelFactory.root.metadata.columnList
            );

            // populate the collection input list right away
            var response = await CnHttpFactory.instance({
              path: "collection",
              data: {
                select: { column: ["id", "name"] },
                modifier: {
                  where: [
                    { column: "collection.active", operator: "=", value: true },
                    {
                      column: "collection.locked",
                      operator: "=",
                      value: false,
                    },
                  ],
                },
              },
            }).query();

            object.collectionList = response.data;
            object.collectionList.unshift({
              id: undefined,
              name: "(Select Collection)",
            });

            // populate the event input list once the event's metadata has been loaded
            await CnEventModelFactory.root.metadata.getPromise();
            object.eventInputList = processInputList(
              ["event_type_id", "datetime"],
              cenozoApp.module("event"),
              CnEventModelFactory.root.metadata.columnList
            );

            // populate the hold input list once the hold's metadata has been loaded
            await CnHoldModelFactory.root.metadata.getPromise();
            object.holdInputList = processInputList(
              ["hold_type_id", "datetime"],
              cenozoApp.module("hold"),
              CnHoldModelFactory.root.metadata.columnList
            );

            // populate the proxy input list once the proxy's metadata has been loaded
            await CnProxyModelFactory.root.metadata.getPromise();
            object.proxyInputList = processInputList(
              ["proxy_type_id", "datetime"],
              cenozoApp.module("proxy"),
              CnProxyModelFactory.root.metadata.columnList
            );

            // populate the study input list right away
            var response = await CnHttpFactory.instance({
              path: "study",
              data: {
                select: { column: ["id", "name"] },
              },
            }).query();

            object.studyList = response.data;
            object.studyList.unshift({
              id: undefined,
              name: "(Select Study)",
            });
          }

          // this is a contructor function so don't await the init() function
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
    cenozo.providers.factory("CnParticipantNotesFactory", [
      "CnBaseNoteFactory",
      "CnSession",
      "$state",
      function (CnBaseNoteFactory, CnSession, $state) {
        var object = function () {
          CnBaseNoteFactory.construct(this, module);

          async function init(object) {
            await object.onView();
            CnSession.setBreadcrumbTrail([
              {
                title: "Participants",
                go: async function () {
                  await $state.go("participant.list");
                },
              },
              {
                title: String($state.params.identifier).split("=").pop(),
                go: async function () {
                  await $state.go("participant.view", {
                    identifier: $state.params.identifier,
                  });
                },
              },
              {
                title: "Notes",
              },
            ]);
          }

          // this is a contructor function so don't await the init() function
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
