define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'AccessAddCtrl', [
    '$scope', 'CnAccessModelFactory',
    function( $scope, CnAccessModelFactory ) {
      $scope.model = CnAccessModelFactory.root;
      $scope.model.promise.then( function() { $scope.record = $scope.model.cnAdd.createRecord(); } );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'AccessListCtrl', [
    '$scope', 'CnAccessModelFactory',
    function( $scope, CnAccessModelFactory ) {
      $scope.model = CnAccessModelFactory.root;
      $scope.model.cnList.load().catch( function exception() { cnFatalError(); } );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'AccessViewCtrl', [
    '$scope', 'CnAccessModelFactory',
    function( $scope, CnAccessModelFactory ) {
      $scope.model = CnAccessModelFactory.root;
      $scope.model.cnView.load().catch( function exception() { cnFatalError(); } );
    }
  ] );

} );
