define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'ApplicationAddCtrl', [
    '$scope', 'CnApplicationModelFactory',
    function( $scope, CnApplicationModelFactory ) {
      $scope.model = CnApplicationModelFactory.root;
      $scope.record = $scope.model.cnAdd.onNew();
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'ApplicationListCtrl', [
    '$scope', 'CnApplicationModelFactory',
    function( $scope, CnApplicationModelFactory ) {
      $scope.model = CnApplicationModelFactory.root;
      $scope.model.cnList.onList().catch( function exception() { cnFatalError(); } );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'ApplicationViewCtrl', [
    '$scope', 'CnApplicationModelFactory',
    function( $scope, CnApplicationModelFactory ) {
      $scope.model = CnApplicationModelFactory.root;
      $scope.model.cnView.onView().catch( function exception() { cnFatalError(); } );
    }
  ] );

} );
