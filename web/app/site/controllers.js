define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cenozo.providers.controller( 'SiteAddCtrl', [
    '$scope', 'CnSiteModelFactory', 'CnSession',
    function( $scope, CnSiteModelFactory, CnSession ) {
      $scope.model = CnSiteModelFactory.root;
      $scope.record = {};
      $scope.model.addModel.onNew( $scope.record ).then( function() {
        $scope.model.setupBreadcrumbTrail( 'add' );
      } ).catch( CnSession.errorHandler );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'SiteListCtrl', [
    '$scope', 'CnSiteModelFactory', 'CnSession',
    function( $scope, CnSiteModelFactory, CnSession ) {
      $scope.model = CnSiteModelFactory.root;
      $scope.model.listModel.onList().then( function() {
        $scope.model.setupBreadcrumbTrail( 'list' );
      } ).catch( CnSession.errorHandler );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'SiteViewCtrl', [
    '$scope', 'CnSiteModelFactory', 'CnSession',
    function( $scope, CnSiteModelFactory, CnSession ) {
      $scope.model = CnSiteModelFactory.root;
      $scope.model.viewModel.onView().then( function() {
        $scope.model.setupBreadcrumbTrail( 'view' );
      } ).catch( CnSession.errorHandler );
    }
  ] );

} );
