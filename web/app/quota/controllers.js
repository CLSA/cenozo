define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cenozo.providers.controller( 'QuotaAddCtrl', [
    '$scope', 'CnQuotaModelFactory',
    function( $scope, CnQuotaModelFactory ) {
      $scope.model = CnQuotaModelFactory.root;
      $scope.record = {};
      $scope.model.addModel.onNew( $scope.record ).catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'QuotaListCtrl', [
    '$scope', 'CnQuotaModelFactory',
    function( $scope, CnQuotaModelFactory ) {
      $scope.model = CnQuotaModelFactory.root;
      $scope.model.listModel.onList().catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'QuotaViewCtrl', [
    '$scope', 'CnQuotaModelFactory',
    function( $scope, CnQuotaModelFactory ) {
      $scope.model = CnQuotaModelFactory.root;
      $scope.model.viewModel.onView().catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

} );
