'use strict';

try { var user = angular.module( 'user' ); }
catch( err ) { var user = angular.module( 'user', [] ); }

/* ######################################################################################################## */
user.controller( 'UserAddCtrl', [
  '$scope', 'CnUserSingleton',
  function( $scope, CnUserSingleton ) {
    // use base class to create controller
    CnBaseAddCtrl.call( this, $scope, CnUserSingleton );
  }
] );

/* ######################################################################################################## */
user.controller( 'UserListCtrl', [
  '$scope', 'CnUserSingleton', 'CnModalRestrictFactory',
  function( $scope, CnUserSingleton, CnModalRestrictFactory ) {
    CnBaseListCtrl.call( this, $scope, CnUserSingleton, CnModalRestrictFactory );
  }
] );

/* ######################################################################################################## */
user.controller( 'UserViewCtrl', [
  '$scope', 'CnUserSingleton',
  function( $scope, CnUserSingleton ) {
    CnBaseViewCtrl.call( this, $scope, CnUserSingleton );
  }
] );
