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
      $scope.model.cnList.list().catch( function exception() { cnFatalError(); } );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'AccessViewCtrl', [
    '$scope', 'CnAccessModelFactory',
    function( $scope, CnAccessModelFactory ) {
      $scope.model = CnAccessModelFactory.root;
      $scope.model.cnView.view().catch( function exception() { cnFatalError(); } );
    }
  ] );

} );
