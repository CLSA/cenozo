define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'AlternateAddCtrl', [
    '$scope', 'CnAlternateSingleton',
    function( $scope, CnAlternateSingleton ) {
      $scope.cnAdd = CnAlternateSingleton.cnAdd;
      $scope.cnList = CnAlternateSingleton.cnList;
      CnAlternateSingleton.promise.then( function() {
        $scope.record = $scope.cnAdd.createRecord();
      } );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'AlternateListCtrl', [
    '$scope', 'CnAlternateSingleton',
    function( $scope, CnAlternateSingleton ) {
      $scope.cnList = CnAlternateSingleton.cnList;
      $scope.cnList.load().catch( function exception() { cnFatalError(); } );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'AlternateViewCtrl', [
    '$stateParams', '$scope', 'CnAlternateSingleton',
    function( $stateParams, $scope, CnAlternateSingleton ) {
      $scope.cnList = CnAlternateSingleton.cnList;
      $scope.cnView = CnAlternateSingleton.cnView;
      $scope.cnView.load( $stateParams.id ).catch( function exception() { cnFatalError(); } );
    }
  ] );

} );
