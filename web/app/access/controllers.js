define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'AccessAddCtrl', [
    '$state', '$stateParams', '$scope', 'CnAccessSingleton',
    function( $state, $stateParams, $scope, CnAccessSingleton ) {
      $scope.cnAdd = CnAccessSingleton.cnAdd;
      $scope.cnList = CnAccessSingleton.cnList;
      CnAccessSingleton.promise.then( function() {
        $scope.record = $scope.cnAdd.createRecord();
      } );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'AccessListCtrl', [
    '$scope', 'CnAccessSingleton',
    function( $scope, CnAccessSingleton ) {
      $scope.cnList = CnAccessSingleton.cnList;
      $scope.cnList.load().catch( function exception() { cnFatalError(); } );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'AccessViewCtrl', [
    '$stateParams', '$scope', 'CnAccessSingleton',
    function( $stateParams, $scope, CnAccessSingleton ) {
      $scope.cnList = CnAccessSingleton.cnList;
      $scope.cnView = CnAccessSingleton.cnView;
      $scope.cnView.load( $stateParams.id ).catch( function exception() { cnFatalError(); } );
    }
  ] );

} );
