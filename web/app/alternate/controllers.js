define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'AlternateAddCtrl', [
    '$scope', 'CnAlternateModelFactory',
    function( $scope, CnAlternateModelFactory ) {
      $scope.model = CnAlternateModelFactory.root;
      $scope.record = {};
      $scope.model.cnAdd.onNew( $scope.record ).catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'AlternateListCtrl', [
    '$scope', 'CnAlternateModelFactory',
    function( $scope, CnAlternateModelFactory ) {
      $scope.model = CnAlternateModelFactory.root;
      $scope.model.cnList.onList().catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'AlternateViewCtrl', [
    '$scope', 'CnAlternateModelFactory',
    function( $scope, CnAlternateModelFactory ) {
      $scope.model = CnAlternateModelFactory.root;
      $scope.model.cnView.onView().catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

} );
