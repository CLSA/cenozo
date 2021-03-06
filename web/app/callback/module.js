cenozoApp.defineModule({
  name: "callback",
  dependencies: ["participant", "site"],
  create: (module) => {
    angular.extend(module, {
      identifier: {},
      name: {
        singular: "callback",
        plural: "callbacks",
        possessive: "callback's",
      },
    });

    // converts participant callbacks into events
    function getEventFromParticipant(participant, timezone) {
      if (angular.isDefined(participant.start)) {
        return participant;
      } else {
        var date = moment(participant.callback);
        var offset = moment.tz.zone(timezone).utcOffset(date.unix());

        // adjust the appointment for daylight savings time
        if (date.tz(timezone).isDST()) offset += -60;

        // get the identifier now and not in the getIdentifier() function below
        var identifier = participant.getIdentifier();
        return {
          getIdentifier: function () {
            return identifier;
          },
          title: participant.uid,
          start: moment(participant.callback).subtract(offset, "minutes"),
          end: moment(participant.callback).subtract(offset - 60, "minutes"),
        };
      }
    }

    /* ############################################################################################## */
    cenozo.providers.directive("cnCallbackCalendar", [
      "CnCallbackModelFactory",
      function (CnCallbackModelFactory) {
        return {
          templateUrl: module.getFileUrl("calendar.tpl.html"),
          restrict: "E",
          scope: {
            model: "=?",
            preventSiteChange: "@",
          },
          controller: function ($scope) {
            if (angular.isUndefined($scope.model))
              $scope.model = CnCallbackModelFactory.instance();
            $scope.model.calendarModel.heading =
              $scope.model.site.name.ucWords() + " Callback Calendar";

            // never show the callback list (there is no such thing)
            var cnRecordCalendarScope = null;
            $scope.$on("cnRecordCalendar ready", function (event, data) {
              cnRecordCalendarScope = data;
              cnRecordCalendarScope.viewList = false;
            });
          },
        };
      },
    ]);

    /* ############################################################################################## */
    cenozo.providers.factory("CnCallbackCalendarFactory", [
      "CnBaseCalendarFactory",
      "CnSession",
      "CnParticipantModelFactory",
      function (CnBaseCalendarFactory, CnSession, CnParticipantModelFactory) {
        var object = function (parentModel, site) {
          CnBaseCalendarFactory.construct(this, parentModel);

          // remove day click callbacks
          delete this.settings.dayClick;

          // define a special event click callback
          this.settings.eventClick = function (record) {
            CnParticipantModelFactory.root.transitionToViewState(record);
          };

          // extend onCalendar to transform templates into events
          this.onCalendar = async function (
            replace,
            minDate,
            maxDate,
            ignoreParent
          ) {
            // we must get the load dates before calling $$onCalendar
            var loadMinDate = this.getLoadMinDate(replace, minDate);
            var loadMaxDate = this.getLoadMaxDate(replace, maxDate);
            await this.$$onCalendar(replace, minDate, maxDate, ignoreParent);

            this.cache.forEach((item, index, array) => {
              array[index] = getEventFromParticipant(
                item,
                CnSession.user.timezone
              );
            });
          };
        };

        return {
          instance: function (parentModel, site) {
            return new object(parentModel, site);
          },
        };
      },
    ]);

    /* ############################################################################################## */
    cenozo.providers.factory("CnCallbackModelFactory", [
      "CnBaseModelFactory",
      "CnCallbackCalendarFactory",
      "CnSession",
      "$state",
      function (
        CnBaseModelFactory,
        CnCallbackCalendarFactory,
        CnSession,
        $state
      ) {
        var object = function (site) {
          if (!angular.isObject(site) || angular.isUndefined(site.id))
            throw new Error(
              "Tried to create CnCallbackModel without specifying the site."
            );

          CnBaseModelFactory.construct(this, module);
          this.calendarModel = CnCallbackCalendarFactory.instance(this, site);
          this.site = site;

          this.getServiceData = function (type, columnRestrictLists) {
            var data = this.$$getServiceData(type, columnRestrictLists);
            data.select = { column: ["id", "uid", "callback"] };
            return data;
          };
        };

        // get the siteColumn to be used by a site's identifier
        var siteModule = cenozoApp.module("site");
        var siteColumn = angular.isDefined(siteModule.identifier.column)
          ? siteModule.identifier.column
          : "id";

        return {
          siteInstanceList: {},
          forSite: function (site) {
            if (!angular.isObject(site)) {
              $state.go("error.404");
              throw new Error(
                'Cannot find site matching identifier "' +
                  site +
                  '", redirecting to 404.'
              );
            }
            if (angular.isUndefined(this.siteInstanceList[site.id])) {
              if (angular.isUndefined(site.getIdentifier))
                site.getIdentifier = function () {
                  return siteColumn + "=" + this[siteColumn];
                };
              this.siteInstanceList[site.id] = new object(site);
            }
            return this.siteInstanceList[site.id];
          },
          instance: function () {
            var site = null;
            if ("calendar" == $state.current.name.split(".")[1]) {
              if (angular.isDefined($state.params.identifier)) {
                var identifier = $state.params.identifier.split("=");
                if (2 == identifier.length)
                  site = CnSession.siteList.findByProperty(
                    identifier[0],
                    identifier[1]
                  );
              }
            } else {
              site = CnSession.site;
            }
            return this.forSite(site);
          },
        };
      },
    ]);
  },
});
