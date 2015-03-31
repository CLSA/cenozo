define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'RegionSiteAddCtrl', [
    '$scope', 'CnRegionSiteSingleton',
    function( $scope, CnRegionSiteSingleton ) {
      $scope.cnAdd = CnRegionSiteSingleton.cnAdd;
      $scope.cnList = CnRegionSiteSingleton.cnList;
      $scope.record = {};
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'RegionSiteListCtrl', [
    '$scope', 'CnRegionSiteSingleton',
    function( $scope, CnRegionSiteSingleton ) {
      $scope.cnList = CnRegionSiteSingleton.cnList;
      $scope.cnList.load().catch( function exception() { cnFatalError(); } );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'RegionSiteViewCtrl', [
    '$stateParams', '$scope', 'CnRegionSiteSingleton',
    function( $stateParams, $scope, CnRegionSiteSingleton ) {
      $scope.cnList = CnRegionSiteSingleton.cnList;
      $scope.cnView = CnRegionSiteSingleton.cnView;
      $scope.cnView.load( $stateParams.id ).catch( function exception() { cnFatalError(); } );
      $scope.patch = cnPatch( $scope );
    }
  ] );

} );
