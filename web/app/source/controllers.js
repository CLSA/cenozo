define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cenozo.providers.controller( 'SourceAddCtrl', [
    '$scope', 'CnSourceModelFactory', 'CnSession',
    function( $scope, CnSourceModelFactory, CnSession ) {
      $scope.model = CnSourceModelFactory.root;
      $scope.record = {};
      $scope.model.addModel.onNew( $scope.record ).then( function() {
        $scope.model.setupBreadcrumbTrail( 'add' );
      } ).catch( CnSession.errorHandler );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'SourceListCtrl', [
    '$scope', 'CnSourceModelFactory', 'CnSession',
    function( $scope, CnSourceModelFactory, CnSession ) {
      $scope.model = CnSourceModelFactory.root;
      $scope.model.listModel.onList( true ).then( function() {
        $scope.model.setupBreadcrumbTrail( 'list' );
      } ).catch( CnSession.errorHandler );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'SourceViewCtrl', [
    '$scope', 'CnSourceModelFactory', 'CnSession',
    function( $scope, CnSourceModelFactory, CnSession ) {
      $scope.model = CnSourceModelFactory.root;
      $scope.model.viewModel.onView().then( function() {
        $scope.model.setupBreadcrumbTrail( 'view' );
      } ).catch( CnSession.errorHandler );
    }
  ] );

} );
