cenozoApp.defineModule({
  name: "search_result",
  models: ["add", "list", "view"],
  create: (module) => {
    angular.extend(module, {
      identifier: {},
      name: {
        singular: "search result",
        plural: "search results",
        possessive: "search result's",
      },
      columnList: {
        record_id: { type: "hidden" },
        hits: {
          title: "Hits",
          type: "number",
          width: "10%",
        },
        uid: {
          column: "participant.uid",
          title: "UID",
          width: "10%",
        },
        full_name: {
          column: "full_name",
          title: "Participant Name",
          width: "20%",
        },
        result: {
          title: "Search Matches",
          type: "string",
          filter: "cnNewlines",
        },
      },
      defaultOrder: {
        column: "hits",
        reverse: true,
      },
    });

    /* ############################################################################################## */
    cenozo.providers.directive("cnSearchResultList", [
      "CnSearchResultModelFactory",
      "$state",
      function (CnSearchResultModelFactory, $state) {
        return {
          templateUrl: module.getFileUrl("list.tpl.html"),
          restrict: "E",
          scope: { model: "=?" },
          controller: function ($scope) {
            if (angular.isUndefined($scope.model))
              $scope.model = CnSearchResultModelFactory.root;
            $scope.q = $state.params.q;
            $scope.working = false;

            $scope.search = async function () {
              $scope.working = true;
              $state.params.q = $scope.q;
              try {
                await $state.go("search_result.list", $state.params);
                await $scope.model.listModel.onList(true);
              } finally {
                $scope.working = false;
              }
            };
          },
        };
      },
    ]);

    /* ############################################################################################## */
    cenozo.providers.factory("CnSearchResultListFactory", [
      "CnBaseListFactory",
      function (CnBaseListFactory) {
        var object = function (parentModel) {
          CnBaseListFactory.construct(this, parentModel);
        };
        return {
          instance: function (parentModel) {
            return new object(parentModel);
          },
        };
      },
    ]);

    /* ############################################################################################## */
    cenozo.providers.factory("CnSearchResultModelFactory", [
      "CnBaseModelFactory",
      "CnSearchResultListFactory",
      "CnHttpFactory",
      "$state",
      function (
        CnBaseModelFactory,
        CnSearchResultListFactory,
        CnHttpFactory,
        $state
      ) {
        var object = function (root) {
          CnBaseModelFactory.construct(this, module);
          this.listModel = CnSearchResultListFactory.instance(this);
          this.getViewEnabled = function () {
            return true;
          };

          this.transitionToViewState = async function (record) {
            await $state.go("participant.view", {
              identifier: "uid=" + record.uid,
            });
          };

          this.getServiceData = function (type, columnRestrictLists) {
            var data = this.$$getServiceData(type, columnRestrictLists);
            if ("list" == type || "report" == type) data.q = $state.params.q;
            return data;
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
