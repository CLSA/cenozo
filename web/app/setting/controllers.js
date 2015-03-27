define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'SettingAddCtrl', [
    '$scope', '$state', 'CnSettingSingleton',
    function( $scope, $state, CnSettingSingleton ) {
      CnBaseAddCtrl.call( this, $scope, CnSettingSingleton );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'SettingListCtrl', [
    '$scope', '$state', 'CnSettingSingleton', 'CnModalRestrictFactory',
    function( $scope, $state, CnSettingSingleton, CnModalRestrictFactory ) {
      CnBaseListCtrl.call( this, $scope, $state, CnSettingSingleton, CnModalRestrictFactory );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'SettingViewCtrl', [
    '$scope', '$state', '$stateParams', 'CnSettingSingleton',
    function( $scope, $state, $stateParams, CnSettingSingleton ) {
      CnBaseViewCtrl.call( this, $scope, $state, CnSettingSingleton );
      $scope.local.cnView.load( $stateParams.id );
    }
  ] );

} );
