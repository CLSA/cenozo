define( [], function() { 
  'use strict';

  /* ######################################################################################################## */
  cenozo.providers.controller( 'EventAddCtrl', [
    '$scope', 'CnEventModelFactory', 'CnSession',
    function( $scope, CnEventModelFactory, CnSession ) {
      $scope.model = CnEventModelFactory.root;
      $scope.record = {};
      $scope.model.addModel.onNew( $scope.record ).then( function() {
        $scope.model.setupBreadcrumbTrail( 'add' );
      } ).catch( CnSession.errorHandler );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'EventListCtrl', [
    '$scope', 'CnEventModelFactory', 'CnSession',
    function( $scope, CnEventModelFactory, CnSession ) {
      $scope.model = CnEventModelFactory.root;
      $scope.model.listModel.onList( true ).then( function() {
        $scope.model.setupBreadcrumbTrail( 'list' );
      } ).catch( CnSession.errorHandler );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'EventViewCtrl', [
    '$scope', 'CnEventModelFactory', 'CnSession',
    function( $scope, CnEventModelFactory, CnSession ) {
      $scope.model = CnEventModelFactory.root;
      $scope.model.viewModel.onView().then( function() {
        $scope.model.setupBreadcrumbTrail( 'view' );
      } ).catch( CnSession.errorHandler );
    }
  ] );

} );
