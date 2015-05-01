define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'UserAddCtrl', [
    '$scope', 'CnUserModelFactory',
    function( $scope, CnUserModelFactory ) {
      $scope.model = CnUserModelFactory.root;
      $scope.model.promise.then( function() { $scope.record = $scope.model.cnAdd.createRecord(); } );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'UserListCtrl', [
    '$scope', 'CnUserModelFactory',
    function( $scope, CnUserModelFactory ) {
      $scope.model = CnUserModelFactory.root;
      $scope.model.cnList.load().catch( function exception() { cnFatalError(); } );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'UserViewCtrl', [
    '$scope', 'CnUserModelFactory',
    function( $scope, CnUserModelFactory ) {
      $scope.model = CnUserModelFactory.root;
      $scope.model.cnView.load().catch( function exception() { cnFatalError(); } );
    }
  ] );

} );
