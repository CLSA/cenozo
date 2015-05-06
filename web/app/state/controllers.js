define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'StateAddCtrl', [
    '$scope', 'CnStateModelFactory',
    function( $scope, CnStateModelFactory ) {
      $scope.model = CnStateModelFactory.root;
      $scope.model.promise.then( function() { $scope.record = $scope.model.cnAdd.createRecord(); } );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'StateListCtrl', [
    '$scope', 'CnStateModelFactory',
    function( $scope, CnStateModelFactory ) {
      $scope.model = CnStateModelFactory.root;
      $scope.model.cnList.onList().catch( function exception() { cnFatalError(); } );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'StateViewCtrl', [
    '$scope', 'CnStateModelFactory',
    function( $scope, CnStateModelFactory ) {
      $scope.model = CnStateModelFactory.root;
      $scope.model.cnView.onView().catch( function exception() { cnFatalError(); } );
    }
  ] );

} );
