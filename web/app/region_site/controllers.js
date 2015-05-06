define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'RegionSiteAddCtrl', [
    '$scope', 'CnRegionSiteModelFactory',
    function( $scope, CnRegionSiteModelFactory ) {
      $scope.model = CnRegionSiteModelFactory.root;
      $scope.record = {};
      $scope.model.cnAdd.onNew( $scope.record ).catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'RegionSiteListCtrl', [
    '$scope', 'CnRegionSiteModelFactory',
    function( $scope, CnRegionSiteModelFactory ) {
      $scope.model = CnRegionSiteModelFactory.root;
      $scope.model.cnList.onList().catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'RegionSiteViewCtrl', [
    '$scope', 'CnRegionSiteModelFactory',
    function( $scope, CnRegionSiteModelFactory ) {
      $scope.model = CnRegionSiteModelFactory.root;
      $scope.model.cnView.onView().catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

} );
