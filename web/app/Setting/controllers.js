define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'SettingAddCtrl', [
    '$scope', 'CnSettingSingleton',
    function( $scope, CnSettingSingleton ) {
      // use base class to create controller
      CnBaseAddCtrl.call( this, $scope, CnSettingSingleton );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'SettingListCtrl', [
    '$scope', '$location', 'CnSettingSingleton', 'CnModalRestrictFactory',
    function( $scope, $location, CnSettingSingleton, CnModalRestrictFactory ) {
      CnBaseListCtrl.call( this, $scope, $location, CnSettingSingleton, CnModalRestrictFactory );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'SettingViewCtrl', [
    '$scope', '$stateParams', 'CnSettingSingleton',
    function( $scope, $stateParams, CnSettingSingleton ) {
      CnBaseViewCtrl.call( this, $scope, CnSettingSingleton );
      $scope.local.cnView.load( $stateParams.id );
    }
  ] );

} );
