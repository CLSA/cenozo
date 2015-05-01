define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'ApplicationAddCtrl', [
    '$scope', 'CnApplicationModelFactory',
    function( $scope, CnApplicationModelFactory ) {
      $scope.model = CnApplicationModelFactory.root;
      $scope.model.promise.then( function() { $scope.record = $scope.model.cnAdd.createRecord(); } );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'ApplicationListCtrl', [
    '$scope', 'CnApplicationModelFactory',
    function( $scope, CnApplicationModelFactory ) {
      $scope.model = CnApplicationModelFactory.root;
      $scope.model.cnList.load().catch( function exception() { cnFatalError(); } );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'ApplicationViewCtrl', [
    '$scope', 'CnApplicationModelFactory',
    function( $scope, CnApplicationModelFactory ) {
      $scope.model = CnApplicationModelFactory.root;
      $scope.model.cnView.load().catch( function exception() { cnFatalError(); } );
    }
  ] );

} );
