define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cenozo.providers.controller( 'RegionSiteAddCtrl', [
    '$scope', 'CnRegionSiteModelFactory',
    function( $scope, CnRegionSiteModelFactory ) {
      $scope.model = CnRegionSiteModelFactory.root;
      $scope.record = {};
      $scope.model.addModel.onNew( $scope.record ).then( function() {
        $scope.model.setupBreadcrumbTrail( 'add' );
      } ).catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'RegionSiteListCtrl', [
    '$scope', 'CnRegionSiteModelFactory',
    function( $scope, CnRegionSiteModelFactory ) {
      $scope.model = CnRegionSiteModelFactory.root;
      $scope.model.listModel.onList().then( function() {
        $scope.model.setupBreadcrumbTrail( 'list' );
      } ).catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'RegionSiteViewCtrl', [
    '$scope', 'CnRegionSiteModelFactory',
    function( $scope, CnRegionSiteModelFactory ) {
      $scope.model = CnRegionSiteModelFactory.root;
      $scope.model.viewModel.onView().then( function() {
        $scope.model.setupBreadcrumbTrail( 'view' );
      } ).catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

} );
