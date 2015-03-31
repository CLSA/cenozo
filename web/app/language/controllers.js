define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'LanguageAddCtrl', [
    '$scope', 'CnLanguageSingleton',
    function( $scope, CnLanguageSingleton ) {
      $scope.cnAdd = CnLanguageSingleton.cnAdd;
      $scope.cnList = CnLanguageSingleton.cnList;
      $scope.record = $scope.cnAdd.createRecord();
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'LanguageListCtrl', [
    '$scope', 'CnLanguageSingleton',
    function( $scope, CnLanguageSingleton ) {
      $scope.cnList = CnLanguageSingleton.cnList;
      $scope.cnList.load().catch( function exception() { cnFatalError(); } );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'LanguageViewCtrl', [
    '$stateParams', '$scope', 'CnLanguageSingleton',
    function( $stateParams, $scope, CnLanguageSingleton ) {
      $scope.cnList = CnLanguageSingleton.cnList;
      $scope.cnView = CnLanguageSingleton.cnView;
      $scope.cnView.load( $stateParams.id ).catch( function exception() { cnFatalError(); } );
      $scope.patch = cnPatch( $scope );
    }
  ] );

} );
