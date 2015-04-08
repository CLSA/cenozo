define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'QuotaAddCtrl', [
    '$scope', 'CnQuotaSingleton',
    function( $scope, CnQuotaSingleton ) {
      $scope.cnAdd = CnQuotaSingleton.cnAdd;
      $scope.cnList = CnQuotaSingleton.cnList;
      CnQuotaSingleton.promise.then( function() {
        $scope.record = $scope.cnAdd.createRecord();
      } );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'QuotaListCtrl', [
    '$scope', 'CnQuotaSingleton',
    function( $scope, CnQuotaSingleton ) {
      $scope.cnList = CnQuotaSingleton.cnList;
      $scope.cnList.load().catch( function exception() { cnFatalError(); } );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'QuotaViewCtrl', [
    '$stateParams', '$scope', 'CnQuotaSingleton',
    function( $stateParams, $scope, CnQuotaSingleton ) {
      $scope.cnList = CnQuotaSingleton.cnList;
      $scope.cnView = CnQuotaSingleton.cnView;
      $scope.cnView.load( $stateParams.id ).catch( function exception() { cnFatalError(); } );
    }
  ] );

} );
