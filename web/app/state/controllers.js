define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'StateAddCtrl', [
    '$scope', '$state', 'CnStateSingleton',
    function( $scope, $state, CnStateSingleton ) {
      CnBaseAddCtrl.call( this, $scope, CnStateSingleton );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'StateListCtrl', [
    '$scope', '$state', 'CnStateSingleton', 'CnModalRestrictFactory',
    function( $scope, $state, CnStateSingleton, CnModalRestrictFactory ) {
      CnBaseListCtrl.call( this, $scope, $state, CnStateSingleton, CnModalRestrictFactory );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'StateViewCtrl', [
    '$scope', '$state', '$stateParams', 'CnStateSingleton',
    function( $scope, $state, $stateParams, CnStateSingleton ) {
      CnBaseViewCtrl.call( this, $scope, $state, CnStateSingleton );
      $scope.local.cnView.load( $stateParams.id );
    }
  ] );

} );
