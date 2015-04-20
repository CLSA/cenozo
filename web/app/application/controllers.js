define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'ApplicationAddCtrl', [
    '$scope', 'CnApplicationSingleton',
    function( $scope, CnApplicationSingleton ) {
      $scope.cnAdd = CnApplicationSingleton.cnAdd;
      $scope.cnList = CnApplicationSingleton.cnList;
      CnApplicationSingleton.promise.then( function() {
        $scope.record = $scope.cnAdd.createRecord();
      } );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'ApplicationListCtrl', [
    '$scope', 'CnApplicationSingleton',
    function( $scope, CnApplicationSingleton ) {
      $scope.cnList = CnApplicationSingleton.cnList;
      $scope.cnList.load().catch( function exception() { cnFatalError(); } );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'ApplicationViewCtrl', [
    '$stateParams', '$scope', 'CnApplicationSingleton',
    function( $stateParams, $scope, CnApplicationSingleton ) {
      $scope.cnList = CnApplicationSingleton.cnList;
      $scope.cnView = CnApplicationSingleton.cnView;
      $scope.cnView.load( $stateParams.id ).catch( function exception() { cnFatalError(); } );
    }
  ] );

} );
