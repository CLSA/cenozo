define( [], function() {

  'use strict';
  var cenozo = angular.module( 'cenozo' );

  /* ######################################################################################################## */
  cenozo.providerscontroller( 'StateAddCtrl', [
    '$scope', 'CnStateModelFactory',
    function( $scope, CnStateModelFactory ) {
      $scope.model = CnStateModelFactory.root;
      $scope.record = {};
      $scope.model.cnAdd.onNew( $scope.record ).catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providerscontroller( 'StateListCtrl', [
    '$scope', 'CnStateModelFactory',
    function( $scope, CnStateModelFactory ) {
      $scope.model = CnStateModelFactory.root;
      $scope.model.cnList.onList().catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providerscontroller( 'StateViewCtrl', [
    '$scope', 'CnStateModelFactory',
    function( $scope, CnStateModelFactory ) {
      $scope.model = CnStateModelFactory.root;
      $scope.model.cnView.onView().catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

} );
