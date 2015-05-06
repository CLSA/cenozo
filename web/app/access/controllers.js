define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'AccessAddCtrl', [
    '$scope', 'CnAccessModelFactory',
    function( $scope, CnAccessModelFactory ) {
      $scope.model = CnAccessModelFactory.root;
      $scope.record = {};
      $scope.model.cnAdd.onNew( $scope.record ).catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'AccessListCtrl', [
    '$scope', 'CnAccessModelFactory',
    function( $scope, CnAccessModelFactory ) {
      $scope.model = CnAccessModelFactory.root;
      $scope.model.cnList.onList().catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'AccessViewCtrl', [
    '$scope', 'CnAccessModelFactory',
    function( $scope, CnAccessModelFactory ) {
      $scope.model = CnAccessModelFactory.root;
      $scope.model.cnView.onView().catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

} );
