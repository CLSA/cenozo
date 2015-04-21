define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'UserAddCtrl', [
    '$scope', 'CnUserSingleton',
    function( $scope, CnUserSingleton ) {
      $scope.cnAdd = CnUserSingleton.cnAdd;
      $scope.cnList = CnUserSingleton.cnList;
      CnUserSingleton.promise.then( function() {
        $scope.record = $scope.cnAdd.createRecord();
      } );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'UserListCtrl', [
    '$scope', 'CnUserSingleton',
    function( $scope, CnUserSingleton ) {
      $scope.cnList = CnUserSingleton.cnList;
      $scope.cnList.load().catch( function exception() { cnFatalError(); } );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'UserViewCtrl', [
    '$stateParams', '$scope', 'CnUserSingleton',
    function( $stateParams, $scope, CnUserSingleton ) {
      $scope.cnList = CnUserSingleton.cnList;
      $scope.cnView = CnUserSingleton.cnView;
      $scope.cnView.load( $stateParams.id ).catch( function exception() { cnFatalError(); } );
    }
  ] );

} );
