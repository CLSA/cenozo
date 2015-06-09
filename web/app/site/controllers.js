define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cenozo.providers.controller( 'SiteAddCtrl', [
    '$scope', 'CnSiteModelFactory',
    function( $scope, CnSiteModelFactory ) {
      $scope.model = CnSiteModelFactory.root;
      $scope.record = {};
      $scope.model.addModel.onNew( $scope.record ).then( function() {
        $scope.model.setupBreadcrumbTrail( 'add' );
      } ).catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'SiteListCtrl', [
    '$scope', 'CnSiteModelFactory',
    function( $scope, CnSiteModelFactory ) {
      $scope.model = CnSiteModelFactory.root;
      $scope.model.listModel.onList().then( function() {
        $scope.model.setupBreadcrumbTrail( 'list' );
      } ).catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'SiteViewCtrl', [
    '$scope', 'CnSiteModelFactory',
    function( $scope, CnSiteModelFactory ) {
      $scope.model = CnSiteModelFactory.root;
      $scope.model.viewModel.onView().then( function() {
        $scope.model.setupBreadcrumbTrail( 'view' );
      } ).catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

} );
