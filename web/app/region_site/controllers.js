define( [], function() {

  'use strict';
  var cenozo = angular.module( 'cenozo' );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'RegionSiteAddCtrl', [
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
  cenozo.providers.controller( 'RegionSiteListCtrl', [
    '$scope', 'CnRegionSiteModelFactory',
    function( $scope, CnRegionSiteModelFactory ) {
      $scope.model = CnRegionSiteModelFactory.root;
      $scope.model.cnList.onList().catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'RegionSiteViewCtrl', [
    '$scope', 'CnRegionSiteModelFactory',
    function( $scope, CnRegionSiteModelFactory ) {
      $scope.model = CnRegionSiteModelFactory.root;
      $scope.model.cnView.onView().catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

} );
