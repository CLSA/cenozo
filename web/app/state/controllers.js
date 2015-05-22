define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cenozo.providers.controller( 'StateAddCtrl', [
    '$scope', 'CnStateModelFactory',
    function( $scope, CnStateModelFactory ) {
      $scope.model = CnStateModelFactory.root;
      $scope.record = {};
      $scope.model.addModel.onNew( $scope.record ).catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'StateListCtrl', [
    '$scope', 'CnStateModelFactory',
    function( $scope, CnStateModelFactory ) {
      $scope.model = CnStateModelFactory.root;
      $scope.model.listModel.onList().catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'StateViewCtrl', [
    '$scope', 'CnStateModelFactory',
    function( $scope, CnStateModelFactory ) {
      $scope.model = CnStateModelFactory.root;
      $scope.model.viewModel.onView().catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

} );
