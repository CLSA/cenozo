define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'SettingListCtrl', [
    '$scope', 'CnSettingSingleton',
    function( $scope, CnSettingSingleton ) {
      $scope.cnList = CnSettingSingleton.cnList;
      $scope.cnList.load().catch( function exception() { cnFatalError(); } );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'SettingViewCtrl', [
    '$stateParams', '$scope', 'CnSettingSingleton',
    function( $stateParams, $scope, CnSettingSingleton ) {
      $scope.cnList = CnSettingSingleton.cnList;
      $scope.cnView = CnSettingSingleton.cnView;
      $scope.cnView.load( $stateParams.id ).catch( function exception() { cnFatalError(); } );
    }
  ] );

} );
