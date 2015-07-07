define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cenozo.providers.controller( 'RegionSiteAddCtrl', [
    '$scope', 'CnRegionSiteModelFactory', 'CnSession',
    function( $scope, CnRegionSiteModelFactory, CnSession ) {
      $scope.model = CnRegionSiteModelFactory.root;
      $scope.record = {};
      $scope.model.addModel.onNew( $scope.record ).then( function() {
        $scope.model.setupBreadcrumbTrail( 'add' );
      } ).catch( CnSession.errorHandler );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'RegionSiteListCtrl', [
    '$scope', 'CnRegionSiteModelFactory', 'CnSession',
    function( $scope, CnRegionSiteModelFactory, CnSession ) {
      $scope.model = CnRegionSiteModelFactory.root;
      $scope.model.listModel.onList( true ).then( function() {
        $scope.model.setupBreadcrumbTrail( 'list' );
      } ).catch( CnSession.errorHandler );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'RegionSiteViewCtrl', [
    '$scope', 'CnRegionSiteModelFactory', 'CnSession',
    function( $scope, CnRegionSiteModelFactory, CnSession ) {
      $scope.model = CnRegionSiteModelFactory.root;
      $scope.model.viewModel.onView().then( function() {
        $scope.model.setupBreadcrumbTrail( 'view' );
      } ).catch( CnSession.errorHandler );
    }
  ] );

} );
