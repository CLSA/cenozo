define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'QuotaAddCtrl', [
    '$state', 'CnQuotaModelFactory',
    function( $state, CnQuotaModelFactory ) {
      $scope.model = CnQuotaModelFactory.root;
      $scope.model.promise.then( function() { $scope.record = $scope.model.cnAdd.createRecord(); } );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'QuotaListCtrl', [
    '$scope', 'CnQuotaModelFactory',
    function( $scope, CnQuotaModelFactory ) {
      $scope.model = CnQuotaModelFactory.root;
      $scope.model.cnList.load().catch( function exception() { cnFatalError(); } );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'QuotaViewCtrl', [
    '$scope', 'CnQuotaModelFactory',
    function( $scope, CnQuotaModelFactory ) {
      $scope.model = CnQuotaModelFactory.root;
      $scope.model.cnView.load().catch( function exception() { cnFatalError(); } );
    }
  ] );

} );
