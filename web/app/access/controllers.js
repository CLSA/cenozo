define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cenozo.providers.controller( 'AccessAddCtrl', [
    '$scope', 'CnAccessModelFactory', 'CnSession',
    function( $scope, CnAccessModelFactory, CnSession ) {
      $scope.model = CnAccessModelFactory.root;
      $scope.record = {};
      $scope.model.addModel.onNew( $scope.record ).then( function() {
        $scope.model.setupBreadcrumbTrail( 'add' );
      } ).catch( CnSession.errorHandler );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'AccessListCtrl', [
    '$scope', 'CnAccessModelFactory', 'CnSession',
    function( $scope, CnAccessModelFactory, CnSession ) {
      $scope.model = CnAccessModelFactory.root;
      $scope.model.listModel.onList( true ).then( function() {
        $scope.model.setupBreadcrumbTrail( 'list' );
      } ).catch( CnSession.errorHandler );
    }
  ] );

} );
