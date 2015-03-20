define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'ActivityAddCtrl', [
    '$scope', 'CnActivitySingleton',
    function( $scope, CnActivitySingleton ) {
      // use base class to create controller
      CnBaseAddCtrl.call( this, $scope, CnActivitySingleton );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'ActivityListCtrl', [
    '$scope', '$location', 'CnActivitySingleton', 'CnModalRestrictFactory',
    function( $scope, $location, CnActivitySingleton, CnModalRestrictFactory ) {
      CnBaseListCtrl.call( this, $scope, $location, CnActivitySingleton, CnModalRestrictFactory );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'ActivityViewCtrl', [
    '$scope', '$stateParams', 'CnActivitySingleton',
    function( $scope, $stateParams, CnActivitySingleton ) {
      CnBaseViewCtrl.call( this, $scope, CnActivitySingleton );
      $scope.local.cnView.load( $stateParams.id );
    }
  ] );

} );
