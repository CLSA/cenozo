define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'ConsentAddCtrl', [
    '$scope', 'CnConsentSingleton',
    function( $scope, CnConsentSingleton ) {
      $scope.cnAdd = CnConsentSingleton.cnAdd;
      $scope.cnList = CnConsentSingleton.cnList;
      CnConsentSingleton.promise.then( function() {
        $scope.record = $scope.cnAdd.createRecord();
      } );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'ConsentListCtrl', [
    '$scope', 'CnConsentSingleton',
    function( $scope, CnConsentSingleton ) {
      $scope.cnList = CnConsentSingleton.cnList;
      $scope.cnList.load().catch( function exception() { cnFatalError(); } );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'ConsentViewCtrl', [
    '$stateParams', '$scope', 'CnConsentSingleton',
    function( $stateParams, $scope, CnConsentSingleton ) {
      $scope.cnList = CnConsentSingleton.cnList;
      $scope.cnView = CnConsentSingleton.cnView;
      $scope.cnView.load( $stateParams.id ).catch( function exception() { cnFatalError(); } );
    }
  ] );

} );
