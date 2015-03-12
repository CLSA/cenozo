'use strict';

try { var activity = angular.module( 'activity' ); }
catch( err ) { var activity = angular.module( 'activity', [] ); }

/* ######################################################################################################## */
activity.controller( 'ActivityAddCtrl', [
  '$scope', 'CnActivitySingleton',
  function( $scope, CnActivitySingleton ) {
    // use base class to create controller
    CnBaseAddCtrl.call( this, $scope, CnActivitySingleton );
  }
] );

/* ######################################################################################################## */
activity.controller( 'ActivityListCtrl', [
  '$scope', '$location', 'CnActivitySingleton', 'CnModalRestrictFactory',
  function( $scope, $location, CnActivitySingleton, CnModalRestrictFactory ) {
    CnBaseListCtrl.call( this, $scope, $location, CnActivitySingleton, CnModalRestrictFactory );
  }
] );

/* ######################################################################################################## */
activity.controller( 'ActivityViewCtrl', [
  '$scope', '$routeParams', 'CnActivitySingleton',
  function( $scope, $routeParams, CnActivitySingleton ) {
    CnBaseViewCtrl.call( this, $scope, CnActivitySingleton );
    $scope.local.cnView.load( $routeParams.id );
  }
] );
