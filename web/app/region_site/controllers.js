define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'RegionSiteAddCtrl', [
    '$scope', 'CnRegionSiteModelFactory',
    function( $scope, CnRegionSiteModelFactory ) {
      $scope.model = CnRegionSiteModelFactory.root;
      $scope.model.promise.then( function() { $scope.record = $scope.model.cnAdd.createRecord(); } );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'RegionSiteListCtrl', [
    '$scope', 'CnRegionSiteModelFactory',
    function( $scope, CnRegionSiteModelFactory ) {
      $scope.model = CnRegionSiteModelFactory.root;
      $scope.model.cnList.load().catch( function exception() { cnFatalError(); } );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'RegionSiteViewCtrl', [
    '$scope', 'CnRegionSiteModelFactory',
    function( $scope, CnRegionSiteModelFactory ) {
      $scope.model = CnRegionSiteModelFactory.root;
      $scope.model.cnView.load().catch( function exception() { cnFatalError(); } );
    }
  ] );

} );
