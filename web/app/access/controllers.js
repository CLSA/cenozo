define( [], function() {

  'use strict';
  var cenozo = angular.module( 'cenozo' );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'AccessAddCtrl', [
    '$scope', 'CnAccessModelFactory',
    function( $scope, CnAccessModelFactory ) {
      $scope.model = CnAccessModelFactory.root;
      $scope.record = {};
      $scope.model.cnAdd.onNew( $scope.record ).catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'AccessListCtrl', [
    '$scope', 'CnAccessModelFactory',
    function( $scope, CnAccessModelFactory ) {
      $scope.model = CnAccessModelFactory.root;
      $scope.model.cnList.onList().catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'AccessViewCtrl', [
    '$scope', 'CnAccessModelFactory',
    function( $scope, CnAccessModelFactory ) {
      $scope.model = CnAccessModelFactory.root;
      $scope.model.cnView.onView().catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

} );
