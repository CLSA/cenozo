define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'QuotaAddCtrl', [
    '$scope', 'CnQuotaModelFactory',
    function( $scope, CnQuotaModelFactory ) {
      $scope.model = CnQuotaModelFactory.root;
      $scope.model.promise.then( function() { $scope.record = $scope.model.cnAdd.createRecord(); } );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'QuotaListCtrl', [
    '$scope', 'CnQuotaModelFactory',
    function( $scope, CnQuotaModelFactory ) {
      $scope.model = CnQuotaModelFactory.root;
      $scope.model.cnList.onList().catch( function exception() { cnFatalError(); } );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'QuotaViewCtrl', [
    '$scope', 'CnQuotaModelFactory',
    function( $scope, CnQuotaModelFactory ) {
      $scope.model = CnQuotaModelFactory.root;
      $scope.model.cnView.onView().catch( function exception() { cnFatalError(); } );
    }
  ] );

} );
