define( [], function() {

  'use strict';
  var cenozo = angular.module( 'cenozo' );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'EventAddCtrl', [
    '$scope', 'CnEventModelFactory',
    function( $scope, CnEventModelFactory ) {
      $scope.model = CnEventModelFactory.root;
      $scope.record = {};
      $scope.model.cnAdd.onNew( $scope.record ).catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'EventListCtrl', [
    '$scope', 'CnEventModelFactory',
    function( $scope, CnEventModelFactory ) {
      $scope.model = CnEventModelFactory.root;
      $scope.model.cnList.onList().catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'EventViewCtrl', [
    '$scope', 'CnEventModelFactory',
    function( $scope, CnEventModelFactory ) {
      $scope.model = CnEventModelFactory.root;
      $scope.model.cnView.onView().catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

} );
