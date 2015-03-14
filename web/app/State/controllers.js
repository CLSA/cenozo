define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'StateAddCtrl', [
    '$scope', 'CnStateSingleton',
    function( $scope, CnStateSingleton ) {
      // use base class to create controller
      CnBaseAddCtrl.call( this, $scope, CnStateSingleton );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'StateListCtrl', [
    '$scope', '$location', 'CnStateSingleton', 'CnModalRestrictFactory',
    function( $scope, $location, CnStateSingleton, CnModalRestrictFactory ) {
      CnBaseListCtrl.call( this, $scope, $location, CnStateSingleton, CnModalRestrictFactory );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'StateViewCtrl', [
    '$scope', '$stateParams', 'CnStateSingleton',
    function( $scope, $stateParams, CnStateSingleton ) {
      CnBaseViewCtrl.call( this, $scope, CnStateSingleton );
      $scope.local.cnView.load( $stateParams.id );
    }
  ] );

} );
