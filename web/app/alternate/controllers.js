define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'AlternateAddCtrl', [
    '$scope', 'CnAlternateModelFactory',
    function( $scope, CnAlternateModelFactory ) {
      $scope.model = CnAlternateModelFactory.root;
      $scope.record = $scope.model.cnAdd.onNew();
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'AlternateListCtrl', [
    '$scope', 'CnAlternateModelFactory',
    function( $scope, CnAlternateModelFactory ) {
      $scope.model = CnAlternateModelFactory.root;
      $scope.model.cnList.onList().catch( function exception() { cnFatalError(); } );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'AlternateViewCtrl', [
    '$scope', 'CnAlternateModelFactory',
    function( $scope, CnAlternateModelFactory ) {
      $scope.model = CnAlternateModelFactory.root;
      $scope.model.cnView.onView().catch( function exception() { cnFatalError(); } );
    }
  ] );

} );
