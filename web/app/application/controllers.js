define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cenozo.providers.controller( 'ApplicationAddCtrl', [
    '$scope', 'CnSessionlicationModelFactory',
    function( $scope, CnSessionlicationModelFactory ) {
      $scope.model = CnSessionlicationModelFactory.root;
      $scope.record = {};
      $scope.model.addModel.onNew( $scope.record ).catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'ApplicationListCtrl', [
    '$scope', 'CnSessionlicationModelFactory',
    function( $scope, CnSessionlicationModelFactory ) {
      $scope.model = CnSessionlicationModelFactory.root;
      $scope.model.listModel.onList().catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'ApplicationViewCtrl', [
    '$scope', 'CnSessionlicationModelFactory',
    function( $scope, CnSessionlicationModelFactory ) {
      $scope.model = CnSessionlicationModelFactory.root;
      $scope.model.viewModel.onView().catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

} );
