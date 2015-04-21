define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'SystemMessageAddCtrl', [
    '$scope', 'CnSystemMessageSingleton',
    function( $scope, CnSystemMessageSingleton ) {
      $scope.cnAdd = CnSystemMessageSingleton.cnAdd;
      $scope.cnList = CnSystemMessageSingleton.cnList;
      CnSystemMessageSingleton.promise.then( function() {
        $scope.record = $scope.cnAdd.createRecord();
      } );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'SystemMessageListCtrl', [
    '$scope', 'CnSystemMessageSingleton',
    function( $scope, CnSystemMessageSingleton ) {
      $scope.cnList = CnSystemMessageSingleton.cnList;
      $scope.cnList.load().catch( function exception() { cnFatalError(); } );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'SystemMessageViewCtrl', [
    '$stateParams', '$scope', 'CnSystemMessageSingleton',
    function( $stateParams, $scope, CnSystemMessageSingleton ) {
      $scope.cnList = CnSystemMessageSingleton.cnList;
      $scope.cnView = CnSystemMessageSingleton.cnView;
      $scope.cnView.load( $stateParams.id ).catch( function exception() { cnFatalError(); } );
    }
  ] );

} );
