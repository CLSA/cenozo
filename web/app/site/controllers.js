define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'SiteAddCtrl', [
    '$scope', 'CnSiteSingleton',
    function( $scope, CnSiteSingleton ) {
      $scope.cnAdd = CnSiteSingleton.cnAdd;
      $scope.cnList = CnSiteSingleton.cnList;
      $scope.record = $scope.cnAdd.createRecord();
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'SiteListCtrl', [
    '$scope', 'CnSiteSingleton',
    function( $scope, CnSiteSingleton ) {
      $scope.cnList = CnSiteSingleton.cnList;
      $scope.cnList.load().catch( function exception() { cnFatalError(); } );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'SiteViewCtrl', [
    '$stateParams', '$scope', 'CnSiteSingleton',
    function( $stateParams, $scope, CnSiteSingleton ) {
      $scope.cnList = CnSiteSingleton.cnList;
      $scope.cnView = CnSiteSingleton.cnView;
      $scope.cnView.load( $stateParams.id ).catch( function exception() { cnFatalError(); } );
    }
  ] );

} );
