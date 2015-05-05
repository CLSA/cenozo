define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'AlternateAddCtrl', [
    '$scope', 'CnAlternateModelFactory',
    function( $scope, CnAlternateModelFactory ) {
      $scope.model = CnAlternateModelFactory.root;
      $scope.model.promise.then( function() { $scope.record = $scope.model.cnAdd.createRecord(); } );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'AlternateListCtrl', [
    '$scope', 'CnAlternateModelFactory',
    function( $scope, CnAlternateModelFactory ) {
      $scope.model = CnAlternateModelFactory.root;
      $scope.model.cnList.list().catch( function exception() { cnFatalError(); } );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'AlternateViewCtrl', [
    '$scope', 'CnAlternateModelFactory',
    function( $scope, CnAlternateModelFactory ) {
      $scope.model = CnAlternateModelFactory.root;
      $scope.model.cnView.view().catch( function exception() { cnFatalError(); } );
    }
  ] );

} );
