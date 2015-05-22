define( [], function() {

  'use strict';
  var cenozo = angular.module( 'cenozo' );

  /* ######################################################################################################## */
  cenozo.providerscontroller( 'UserAddCtrl', [
    '$scope', 'CnUserModelFactory',
    function( $scope, CnUserModelFactory ) {
      $scope.model = CnUserModelFactory.root;
      $scope.record = {};
      $scope.model.cnAdd.onNew( $scope.record ).catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providerscontroller( 'UserListCtrl', [
    '$scope', 'CnUserModelFactory',
    function( $scope, CnUserModelFactory ) {
      $scope.model = CnUserModelFactory.root;
      $scope.model.cnList.onList().catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providerscontroller( 'UserViewCtrl', [
    '$scope', 'CnUserModelFactory',
    function( $scope, CnUserModelFactory ) {
      $scope.model = CnUserModelFactory.root;
      $scope.model.cnView.onView().catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

} );
