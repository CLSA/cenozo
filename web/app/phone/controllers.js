define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'PhoneAddCtrl', [
    '$scope', 'CnPhoneSingleton',
    function( $scope, CnPhoneSingleton ) {
      $scope.cnAdd = CnPhoneSingleton.cnAdd;
      $scope.cnList = CnPhoneSingleton.cnList;
      CnPhoneSingleton.promise.then( function() {
        $scope.record = $scope.cnAdd.createRecord();
      } );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'PhoneListCtrl', [
    '$scope', 'CnPhoneSingleton',
    function( $scope, CnPhoneSingleton ) {
      $scope.cnList = CnPhoneSingleton.cnList;
      $scope.cnList.load().catch( function exception() { cnFatalError(); } );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'PhoneViewCtrl', [
    '$stateParams', '$scope', 'CnPhoneSingleton',
    function( $stateParams, $scope, CnPhoneSingleton ) {
      $scope.cnList = CnPhoneSingleton.cnList;
      $scope.cnView = CnPhoneSingleton.cnView;
      $scope.cnView.load( $stateParams.id ).catch( function exception() { cnFatalError(); } );
    }
  ] );

} );
