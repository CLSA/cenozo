define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cenozo.providers.controller( 'UserAddCtrl', [
    '$scope', 'CnUserModelFactory',
    function( $scope, CnUserModelFactory ) {
      $scope.model = CnUserModelFactory.root;
      $scope.record = {};
      $scope.model.addModel.onNew( $scope.record ).then( function() {
        $scope.model.setupBreadcrumbTrail( 'add' );
      } ).catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'UserListCtrl', [
    '$scope', 'CnUserModelFactory',
    function( $scope, CnUserModelFactory ) {
      $scope.model = CnUserModelFactory.root;
      $scope.model.listModel.onList().then( function() {
        $scope.model.setupBreadcrumbTrail( 'list' );
      } ).catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'UserViewCtrl', [
    '$scope', 'CnUserModelFactory',
    function( $scope, CnUserModelFactory ) {
      $scope.model = CnUserModelFactory.root;
      $scope.model.viewModel.onView().then( function() {
        $scope.model.setupBreadcrumbTrail( 'view' );
      } ).catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

} );
