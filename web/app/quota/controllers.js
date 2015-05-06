define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'QuotaAddCtrl', [
    '$scope', 'CnQuotaModelFactory',
    function( $scope, CnQuotaModelFactory ) {
      $scope.model = CnQuotaModelFactory.root;
      $scope.record = {};
      $scope.model.cnAdd.onNew( $scope.record ).catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'QuotaListCtrl', [
    '$scope', 'CnQuotaModelFactory',
    function( $scope, CnQuotaModelFactory ) {
      $scope.model = CnQuotaModelFactory.root;
      $scope.model.cnList.onList().catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'QuotaViewCtrl', [
    '$scope', 'CnQuotaModelFactory',
    function( $scope, CnQuotaModelFactory ) {
      $scope.model = CnQuotaModelFactory.root;
      $scope.model.cnView.onView().catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

} );
