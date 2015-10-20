define( [], function() { 
  'use strict';

  /* ######################################################################################################## */
  cenozo.providers.controller( 'AlternateAddCtrl', [
    '$scope', 'CnAlternateModelFactory', 'CnSession',
    function( $scope, CnAlternateModelFactory, CnSession ) {
      $scope.model = CnAlternateModelFactory.root;
      $scope.record = {};
      $scope.model.addModel.onNew( $scope.record ).then( function() {
        $scope.model.setupBreadcrumbTrail( 'add' );
      } ).catch( CnSession.errorHandler );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'AlternateListCtrl', [
    '$scope', 'CnAlternateModelFactory', 'CnSession',
    function( $scope, CnAlternateModelFactory, CnSession ) {
      $scope.model = CnAlternateModelFactory.root;
      $scope.model.listModel.onList( true ).then( function() {
        $scope.model.setupBreadcrumbTrail( 'list' );
      } ).catch( CnSession.errorHandler );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'AlternateViewCtrl', [
    '$scope', 'CnAlternateModelFactory', 'CnSession',
    function( $scope, CnAlternateModelFactory, CnSession ) {
      $scope.model = CnAlternateModelFactory.root;
      $scope.model.viewModel.onView().then( function() {
        $scope.model.setupBreadcrumbTrail( 'view' );
      } ).catch( CnSession.errorHandler );
    }
  ] );

} );
