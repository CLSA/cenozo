define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cenozo.providers.controller( 'StateAddCtrl', [
    '$scope', 'CnStateModelFactory', 'CnSession',
    function( $scope, CnStateModelFactory, CnSession ) {
      $scope.model = CnStateModelFactory.root;
      $scope.record = {};
      $scope.model.addModel.onNew( $scope.record ).then( function() {
        $scope.model.setupBreadcrumbTrail( 'add' );
      } ).catch( CnSession.errorHandler );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'StateListCtrl', [
    '$scope', 'CnStateModelFactory', 'CnSession',
    function( $scope, CnStateModelFactory, CnSession ) {
      $scope.model = CnStateModelFactory.root;
      $scope.model.listModel.onList().then( function() {
        $scope.model.setupBreadcrumbTrail( 'list' );
      } ).catch( CnSession.errorHandler );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'StateViewCtrl', [
    '$scope', 'CnStateModelFactory', 'CnSession',
    function( $scope, CnStateModelFactory, CnSession ) {
      $scope.model = CnStateModelFactory.root;
      $scope.model.viewModel.onView().then( function() {
        $scope.model.setupBreadcrumbTrail( 'view' );
      } ).catch( CnSession.errorHandler );
    }
  ] );

} );
