define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'RegionSiteAddCtrl', [
    '$scope', '$state', 'CnRegionSiteSingleton',
    function( $scope, $state, CnRegionSiteSingleton ) {
      CnBaseAddCtrl.call( this, $scope, CnRegionSiteSingleton );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'RegionSiteListCtrl', [
    '$scope', '$state', 'CnRegionSiteSingleton', 'CnModalRestrictFactory',
    function( $scope, $state, CnRegionSiteSingleton, CnModalRestrictFactory ) {
      CnBaseListCtrl.call( this, $scope, $state, CnRegionSiteSingleton, CnModalRestrictFactory );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'RegionSiteViewCtrl', [
    '$scope', '$state', '$stateParams', 'CnRegionSiteSingleton',
    function( $scope, $state, $stateParams, CnRegionSiteSingleton ) {
      CnBaseViewCtrl.call( this, $scope, $state, CnRegionSiteSingleton );
      $scope.local.cnView.load( $stateParams.id );
    }
  ] );

} );
