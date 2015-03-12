'use strict';

try { var state = angular.module( 'state' ); }
catch( err ) { var state = angular.module( 'state', [] ); }

/* ######################################################################################################## */
state.controller( 'StateAddCtrl', [
  '$scope', 'CnStateSingleton',
  function( $scope, CnStateSingleton ) {
    // use base class to create controller
    CnBaseAddCtrl.call( this, $scope, CnStateSingleton );
  }
] );

/* ######################################################################################################## */
state.controller( 'StateListCtrl', [
  '$scope', '$location', 'CnStateSingleton', 'CnModalRestrictFactory',
  function( $scope, $location, CnStateSingleton, CnModalRestrictFactory ) {
    CnBaseListCtrl.call( this, $scope, $location, CnStateSingleton, CnModalRestrictFactory );
  }
] );

/* ######################################################################################################## */
state.controller( 'StateViewCtrl', [
  '$scope', '$routeParams', 'CnStateSingleton',
  function( $scope, $routeParams, CnStateSingleton ) {
    CnBaseViewCtrl.call( this, $scope, CnStateSingleton );
    $scope.local.cnView.load( $routeParams.id );
  }
] );
