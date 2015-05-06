define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'StateAddCtrl', [
    '$scope', 'CnStateModelFactory',
    function( $scope, CnStateModelFactory ) {
      $scope.model = CnStateModelFactory.root;
      $scope.record = {};
      $scope.model.cnAdd.onNew( $scope.record ).catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'StateListCtrl', [
    '$scope', 'CnStateModelFactory',
    function( $scope, CnStateModelFactory ) {
      $scope.model = CnStateModelFactory.root;
      $scope.model.cnList.onList().catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'StateViewCtrl', [
    '$scope', 'CnStateModelFactory',
    function( $scope, CnStateModelFactory ) {
      $scope.model = CnStateModelFactory.root;
      $scope.model.cnView.onView().catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

} );
