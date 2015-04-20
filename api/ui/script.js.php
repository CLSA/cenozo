'use strict';

var cenozoApp = angular.module( 'cenozoApp' );

var cnListModules = <?php print $list_module_string; ?>;
var cnUtilityModules = <?php print $utility_module_string; ?>;
var cnReportModules = <?php print $report_module_string; ?>;

cenozoApp.config( [
  '$stateProvider',
  function( $stateProvider ) {
    for( var subject in cnListModules )
      cnRouteModule( $stateProvider, { name: subject, actions: cnListModules[subject].actions } );
  }
] );

cenozoApp.controller( 'CnMenuCtrl', [
  '$scope', '$state',
  function( $scope, $state ) {
    $scope.isCurrentState = function isCurrentState( state ) { return $state.is( state ); };
    $scope.lists = cnListModules;
    $scope.utilities = cnUtilityModules;
    $scope.reports = cnReportModules;
  }
] );
