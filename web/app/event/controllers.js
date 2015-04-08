define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'EventAddCtrl', [
    '$scope', 'CnEventSingleton',
    function( $scope, CnEventSingleton ) {
      $scope.cnAdd = CnEventSingleton.cnAdd;
      $scope.cnList = CnEventSingleton.cnList;
      CnEventSingleton.promise.then( function() {
        $scope.record = $scope.cnAdd.createRecord();
      } );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'EventListCtrl', [
    '$scope', 'CnEventSingleton',
    function( $scope, CnEventSingleton ) {
      $scope.cnList = CnEventSingleton.cnList;
      $scope.cnList.load().catch( function exception() { cnFatalError(); } );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'EventViewCtrl', [
    '$stateParams', '$scope', 'CnEventSingleton',
    function( $stateParams, $scope, CnEventSingleton ) {
      $scope.cnList = CnEventSingleton.cnList;
      $scope.cnView = CnEventSingleton.cnView;
      $scope.cnView.load( $stateParams.id ).catch( function exception() { cnFatalError(); } );
    }
  ] );

} );
