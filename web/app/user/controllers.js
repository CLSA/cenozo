define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cenozo.providers.controller( 'UserAddCtrl', [
    '$scope', 'CnUserModelFactory',
    function( $scope, CnUserModelFactory ) {
      $scope.model = CnUserModelFactory.root;
      $scope.record = {};
      $scope.model.addModel.onNew( $scope.record ).catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'UserListCtrl', [
    '$scope', 'CnUserModelFactory',
    function( $scope, CnUserModelFactory ) {
      $scope.model = CnUserModelFactory.root;
      $scope.model.listModel.onList().catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'UserViewCtrl', [
    '$scope', 'CnUserModelFactory',
    function( $scope, CnUserModelFactory ) {
      $scope.model = CnUserModelFactory.root;
      $scope.model.viewModel.onView().catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

} );
