define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cenozo.providers.controller( 'AlternateAddCtrl', [
    '$scope', 'CnAlternateModelFactory',
    function( $scope, CnAlternateModelFactory ) {
      $scope.model = CnAlternateModelFactory.root;
      $scope.record = {};
      $scope.model.addModel.onNew( $scope.record ).then( function() {
        $scope.model.setupBreadcrumbTrail( 'add' );
      } ).catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'AlternateListCtrl', [
    '$scope', 'CnAlternateModelFactory',
    function( $scope, CnAlternateModelFactory ) {
      $scope.model = CnAlternateModelFactory.root;
      $scope.model.listModel.onList().then( function() {
        $scope.model.setupBreadcrumbTrail( 'list' );
      } ).catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'AlternateViewCtrl', [
    '$scope', 'CnAlternateModelFactory',
    function( $scope, CnAlternateModelFactory ) {
      $scope.model = CnAlternateModelFactory.root;
      $scope.model.viewModel.onView().then( function() {
        $scope.model.setupBreadcrumbTrail( 'view' );
      } ).catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

} );
