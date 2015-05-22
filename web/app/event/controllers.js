define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cenozo.providers.controller( 'EventAddCtrl', [
    '$scope', 'CnEventModelFactory',
    function( $scope, CnEventModelFactory ) {
      $scope.model = CnEventModelFactory.root;
      $scope.record = {};
      $scope.model.addModel.onNew( $scope.record ).catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'EventListCtrl', [
    '$scope', 'CnEventModelFactory',
    function( $scope, CnEventModelFactory ) {
      $scope.model = CnEventModelFactory.root;
      $scope.model.listModel.onList().catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'EventViewCtrl', [
    '$scope', 'CnEventModelFactory',
    function( $scope, CnEventModelFactory ) {
      $scope.model = CnEventModelFactory.root;
      $scope.model.viewModel.onView().catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

} );
