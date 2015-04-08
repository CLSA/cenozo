define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'CollectionAddCtrl', [
    '$scope', 'CnCollectionSingleton',
    function( $scope, CnCollectionSingleton ) {
      $scope.cnAdd = CnCollectionSingleton.cnAdd;
      $scope.cnList = CnCollectionSingleton.cnList;
      CnCollectionSingleton.promise.then( function() {
        $scope.record = $scope.cnAdd.createRecord();
      } );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'CollectionListCtrl', [
    '$scope', 'CnCollectionSingleton',
    function( $scope, CnCollectionSingleton ) {
      $scope.cnList = CnCollectionSingleton.cnList;
      $scope.cnList.load().catch( function exception() { cnFatalError(); } );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'CollectionViewCtrl', [
    '$stateParams', '$scope', 'CnCollectionSingleton',
    function( $stateParams, $scope, CnCollectionSingleton ) {
      $scope.cnList = CnCollectionSingleton.cnList;
      $scope.cnView = CnCollectionSingleton.cnView;
      $scope.cnView.load( $stateParams.id ).catch( function exception() { cnFatalError(); } );
    }
  ] );

} );
