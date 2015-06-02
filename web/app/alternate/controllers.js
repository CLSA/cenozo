define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cenozo.providers.controller( 'AlternateAddCtrl', [
    '$scope', 'CnAlternateModelFactory',
    function( $scope, CnAlternateModelFactory ) {
      $scope.model = CnAlternateModelFactory.root;
      $scope.record = {};
      $scope.model.addModel.onNew( $scope.record ).catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'AlternateListCtrl', [
    '$scope', 'CnAlternateModelFactory',
    function( $scope, CnAlternateModelFactory ) {
      $scope.model = CnAlternateModelFactory.root;
      $scope.model.listModel.onList().catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'AlternateViewCtrl', [
    '$scope', 'CnAlternateModelFactory',
    function( $scope, CnAlternateModelFactory ) {
      $scope.model = CnAlternateModelFactory.root;
      $scope.model.viewModel.onView().catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

} );
