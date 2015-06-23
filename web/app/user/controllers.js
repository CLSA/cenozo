define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cenozo.providers.controller( 'UserAddCtrl', [
    '$scope', 'CnUserModelFactory', 'CnSession',
    function( $scope, CnUserModelFactory, CnSession ) {
      $scope.model = CnUserModelFactory.root;
      $scope.record = {};
      $scope.model.addModel.onNew( $scope.record ).then( function() {
        $scope.model.setupBreadcrumbTrail( 'add' );
      } ).catch( CnSession.errorHandler );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'UserListCtrl', [
    '$scope', 'CnUserModelFactory', 'CnSession',
    function( $scope, CnUserModelFactory, CnSession ) {
      $scope.model = CnUserModelFactory.root;
      $scope.model.listModel.onList().then( function() {
        $scope.model.setupBreadcrumbTrail( 'list' );
      } ).catch( CnSession.errorHandler );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'UserViewCtrl', [
    '$scope', 'CnUserModelFactory', 'CnSession',
    function( $scope, CnUserModelFactory, CnSession ) {
      $scope.model = CnUserModelFactory.root;
      $scope.model.viewModel.onView().then( function() {
        $scope.model.setupBreadcrumbTrail( 'view' );
      } ).catch( CnSession.errorHandler );
    }
  ] );

} );
