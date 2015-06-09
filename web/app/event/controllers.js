define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cenozo.providers.controller( 'EventAddCtrl', [
    '$scope', 'CnEventModelFactory',
    function( $scope, CnEventModelFactory ) {
      $scope.model = CnEventModelFactory.root;
      $scope.record = {};
      $scope.model.addModel.onNew( $scope.record ).then( function() {
        $scope.model.setupBreadcrumbTrail( 'add' );
      } ).catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'EventListCtrl', [
    '$scope', 'CnEventModelFactory',
    function( $scope, CnEventModelFactory ) {
      $scope.model = CnEventModelFactory.root;
      $scope.model.listModel.onList().then( function() {
        $scope.model.setupBreadcrumbTrail( 'list' );
      } ).catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'EventViewCtrl', [
    '$scope', 'CnEventModelFactory',
    function( $scope, CnEventModelFactory ) {
      $scope.model = CnEventModelFactory.root;
      $scope.model.viewModel.onView().then( function() {
        $scope.model.setupBreadcrumbTrail( 'view' );
      } ).catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

} );
