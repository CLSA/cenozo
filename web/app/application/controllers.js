define( [], function() {

  'use strict';
  var cenozo = angular.module( 'cenozo' );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'ApplicationAddCtrl', [
    '$scope', 'CnApplicationModelFactory',
    function( $scope, CnApplicationModelFactory ) {
      $scope.model = CnApplicationModelFactory.root;
      $scope.record = {};
      $scope.model.cnAdd.onNew( $scope.record ).catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'ApplicationListCtrl', [
    '$scope', 'CnApplicationModelFactory',
    function( $scope, CnApplicationModelFactory ) {
      $scope.model = CnApplicationModelFactory.root;
      $scope.model.cnList.onList().catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'ApplicationViewCtrl', [
    '$scope', 'CnApplicationModelFactory',
    function( $scope, CnApplicationModelFactory ) {
      $scope.model = CnApplicationModelFactory.root;
      $scope.model.cnView.onView().catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

} );
