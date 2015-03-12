'use strict';

try { var setting = angular.module( 'setting' ); }
catch( err ) { var setting = angular.module( 'setting', [] ); }

/* ######################################################################################################## */
setting.controller( 'SettingAddCtrl', [
  '$scope', 'CnSettingSingleton',
  function( $scope, CnSettingSingleton ) {
    // use base class to create controller
    CnBaseAddCtrl.call( this, $scope, CnSettingSingleton );
  }
] );

/* ######################################################################################################## */
setting.controller( 'SettingListCtrl', [
  '$scope', '$location', 'CnSettingSingleton', 'CnModalRestrictFactory',
  function( $scope, $location, CnSettingSingleton, CnModalRestrictFactory ) {
    CnBaseListCtrl.call( this, $scope, $location, CnSettingSingleton, CnModalRestrictFactory );
  }
] );

/* ######################################################################################################## */
setting.controller( 'SettingViewCtrl', [
  '$scope', '$routeParams', 'CnSettingSingleton',
  function( $scope, $routeParams, CnSettingSingleton ) {
    CnBaseViewCtrl.call( this, $scope, CnSettingSingleton );
    $scope.local.cnView.load( $routeParams.id );
  }
] );
