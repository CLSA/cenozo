define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'StateAddCtrl', [
    '$scope', 'CnStateSingleton',
    function( $scope, CnStateSingleton ) {
      $scope.cnAdd = CnStateSingleton.cnAdd;
      $scope.cnList = CnStateSingleton.cnList;
      $scope.record = $scope.cnAdd.createRecord();
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'StateListCtrl', [
    '$scope', 'CnStateSingleton',
    function( $scope, CnStateSingleton ) {
      $scope.cnList = CnStateSingleton.cnList;
      $scope.cnList.load().catch( function exception() { cnFatalError(); } );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'StateViewCtrl', [
    '$stateParams', '$scope', 'CnStateSingleton',
    function( $stateParams, $scope, CnStateSingleton ) {
      $scope.cnList = CnStateSingleton.cnList;
      $scope.cnView = CnStateSingleton.cnView;
      $scope.cnView.load( $stateParams.id ).catch( function exception() { cnFatalError(); } );
      $scope.patch = cnPatch( $scope );
    }
  ] );

} );
