define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'SiteAddCtrl', [
    '$scope', '$state', 'CnSiteSingleton',
    function( $scope, $state, CnSiteSingleton ) {
      CnBaseAddCtrl.call( this, $scope, CnSiteSingleton );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'SiteListCtrl', [
    '$scope', '$state', 'CnSiteSingleton', 'CnModalRestrictFactory',
    function( $scope, $state, CnSiteSingleton, CnModalRestrictFactory ) {
      CnBaseListCtrl.call( this, $scope, $state, CnSiteSingleton, CnModalRestrictFactory );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'SiteViewCtrl', [
    '$scope', '$state', '$stateParams', 'CnSiteSingleton',
    function( $scope, $state, $stateParams, CnSiteSingleton ) {
      CnBaseViewCtrl.call( this, $scope, $state, CnSiteSingleton );
      $scope.local.cnView.load( $stateParams.id );
    }
  ] );

} );
