define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cenozo.providers.controller( 'AccessAddCtrl', [
    '$scope', 'CnAccessModelFactory',
    function( $scope, CnAccessModelFactory ) {
      $scope.model = CnAccessModelFactory.root;
      $scope.record = {};
      $scope.model.addModel.onNew( $scope.record ).then( function() {
        $scope.model.setupBreadcrumbTrail( 'add' );
      } ).catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'AccessListCtrl', [
    '$scope', 'CnAccessModelFactory',
    function( $scope, CnAccessModelFactory ) {
      $scope.model = CnAccessModelFactory.root;
      $scope.model.listModel.onList().then( function() {
        $scope.model.setupBreadcrumbTrail( 'list' );
      } ).catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

} );
